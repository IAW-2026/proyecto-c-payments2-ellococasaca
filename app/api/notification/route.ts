
import { addMPId, createPayout, getCharge, rejectCharge, searchPayout, updateCharge } from "@/app/lib/actions";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";


const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

if (!MP_WEBHOOK_SECRET) {
  throw new Error("Missing environment variable: MP_WEBHOOK_SECRET");
}


interface MercadoPagoWebhookPayload {
  id?: string | number;
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
}

/**
 * Transforms an array of product objects into an array of [quantity, productId] tuples.
 * @param products - The array of product objects, e.g., [{ productId: string, quantity: number }].
 * @returns An array of tuples, e.g., [[number, string]].
 */
function transformProductEntries(products: { productId: string; quantity: number }[]): [string,number][] {
  if (!Array.isArray(products)) {
    // Return an empty array or handle error if products is not in the expected format
    return [];
  }
  return products.map(p => [p.productId, p.quantity,]);
}

/**
 * Formats a shipping address string into a structured object.
 * @param address - The shipping address, which can be a pre-formatted object or a string.
 * @returns A structured address object or null if the format is invalid.
 */
function formatShippingAddress(address: unknown): { street: string; city: string; province: string; postalCode: string; country: string; } | null {
  if (typeof address === 'object' && address !== null && 'street' in address && 'city' in address) {
    // It's already a structured object, just return it.
    // You might want to add more validation here to ensure all properties exist.
    return address as { street: string; city: string; province: string; postalCode: string; country: string; };
  }

  if (typeof address === 'string') {
    const parts = address.split(',').map(part => part.trim());
    if (parts.length < 5) {
      console.error("Invalid shipping_address string format:", address);
      return null;
    }
    return {
      street: parts[0],
      city: parts[1],
      province: parts[2],
      postalCode: parts[3],
      country: parts[4],
    };
  }

  console.error("shipping_address is not a recognizable format:", address);
  return null;
}

const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // ------------------------------------------------------------
    // STEP 1: Validate required headers
    // ------------------------------------------------------------

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    

    if (!xSignature || !xRequestId) {
      console.error("Missing required Mercado Pago headers");

      return NextResponse.json(
        {
          error: "Missing signature headers",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // STEP 2: Parse x-signature header
    //
    // Official docs section:
    // "Validate notification origin"
    //
    // Expected format:
    // ts=1704908010,v1=abcdef123456...
    // ------------------------------------------------------------

    let ts: string | null = null;
    let receivedSignature: string | null = null;

    const signatureParts = xSignature.split(",");

    for (const part of signatureParts) {
      const [key, value] = part.split("=");

      if (!key || !value) continue;

      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedKey === "ts") {
        ts = trimmedValue;
      }

      if (trimmedKey === "v1") {
        receivedSignature = trimmedValue;
      }
    }

    if (!ts || !receivedSignature) {
      console.error("Invalid x-signature format");

      return NextResponse.json(
        {
          error: "Invalid signature format",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // STEP 3: Obtain query param data.id
    //
    // Official template:
    // id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    // ------------------------------------------------------------

    const dataId = (
      req.nextUrl.searchParams.get("data.id") || ""
    ).toLowerCase();

    if (!dataId) {
      console.error("Missing query param: data.id");

      return NextResponse.json(
        {
          error: "Missing data.id query param",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // STEP 4: Build manifest EXACTLY as documented
    //
    // Official docs section:
    // "Validate notification origin"
    // ------------------------------------------------------------

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // ------------------------------------------------------------
    // STEP 5: Generate HMAC SHA256 signature
    // ------------------------------------------------------------

    const generatedSignature = crypto
      .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET!)
      .update(manifest)
      .digest("hex");

    // ------------------------------------------------------------
    // STEP 6: Constant-time comparison ya comendao
    // ------------------------------------------------------------
/*
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");

    const validSignature =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!validSignature) {
      console.error(
      req.body
      );

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        { status: 401 }
      );
    }
*/
    // ------------------------------------------------------------
    // STEP 7: Capture RAW BODY before JSON parsing
    //
    // Official recommendation:
    // Signature validation must happen before parsing JSON.
    // ------------------------------------------------------------

    const rawBody = await req.text();

    let payload: MercadoPagoWebhookPayload;

    try {
      payload = JSON.parse(rawBody) as MercadoPagoWebhookPayload;
    } catch (err) {
      console.error("Invalid JSON payload", err);

      return NextResponse.json(
        {
          error: "Invalid JSON payload",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // STEP 8: Idempotency protection
    //
    // Recommendation:
    // Use payload.id or a composite event key.
    // ------------------------------------------------------------

    const eventId = String(payload.id || dataId);

    if (processedEvents.has(eventId)) {
      console.log("Duplicate webhook ignored", {
        eventId,
      });

      return NextResponse.json(
        {
          status: "duplicate_ignored",
        },
        { status: 200 }
      );
    }

    processedEvents.add(eventId);

    // ------------------------------------------------------------
    // STEP 9: Process webhook event
    // ------------------------------------------------------------

    const paymentId = payload.data!.id;

    const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    }
  );

  const payment = await response.json();

  const charge_id = payment.external_reference;
  const status = payment.status;
  //console.log("status: "+status)
  //console.log("charge_id: "+charge_id)
  //console.log("payment: "+JSON.stringify(payment))
  if (status === "approved") {  
    await updateCharge(charge_id)
    await addMPId(charge_id, payment.id.toString())
  }else {
    await rejectCharge(charge_id)
    return NextResponse.json(
      {
        status: "ok",
      },
      { status: 200 }
    );
  }

   try {
    let shipmentUrl = new URL("https://proyecto-c-shipping2-ellococasaca.vercel.app/api/shipments", req.url).toString();
    if (shipmentUrl.includes("localhost") && shipmentUrl.startsWith("https://")) {
      shipmentUrl = shipmentUrl.replace("https://", "http://");
    }
    const charge = await getCharge(charge_id);
    if (!charge) {
      console.error("Charge not found for shipment notification:", charge_id);
    }
    const payoutResult = await searchPayout(charge_id);
    const payout = Array.isArray(payoutResult) ? payoutResult[0] : undefined;
    if (!payout) {    
      console.error("Payout not found for shipment notification:", charge_id, payoutResult);
    }
    if (!payout?.seller_id) {
      console.error("Seller ID is null for payout:", payout);
    }


    const productIdsArray = Array.isArray(charge?.products)
      ? (charge.products as { productId: string }[]).map((product) => product.productId)
      : [];

    const shipmentResponse = await fetch(shipmentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId : charge?.order_id,
        chargeId: charge_id,
        buyerId: charge?.buyer_id,
        sellerId: payout?.seller_id,
        productIds: productIdsArray,
        shippingAddress: formatShippingAddress(charge?.shipping_address),
      }),
    });
    console.log("Shipment API response:", shipmentResponse);
    if (!shipmentResponse.ok) {
      const errorData = await shipmentResponse.json().catch(() => null);
      console.error("Failed to notify shipment API:", shipmentResponse.statusText);
    }

    //-----------------------------
    
    const sellerUrl = new URL("https://proyecto-c-seller-ellococasaca.vercel.app/api/orders", req.url).toString();
    console.log("buyer_id: "+charge!.buyer_id)
    const transformedProducts = transformProductEntries(charge!.products as { productId: string; quantity: number }[]);
    console.log("products: "+transformedProducts)
    const sellerResponse = await fetch(sellerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyerId: charge!.buyer_id,
        items: transformedProducts,
      }),
    });
    
  } catch (error) {
    console.error("Error notifying seller API:", error);
  }

    // ------------------------------------------------------------
    // STEP 10: Acknowledge reception
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        status: "ok",
      },
      { status: 200 }
    );
  } catch (err) {
    // ------------------------------------------------------------
    // Internal server error
    // ------------------------------------------------------------

    console.error("Unexpected webhook processing error", err);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}