
import { createPayout, rejectCharge, updateCharge } from "@/app/lib/actions";
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
    // STEP 6: Constant-time comparison
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
    }*/

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

  if (status === "approved") {  
    updateCharge(charge_id)
    createPayout(payment.buyer_id, payment.transaction_amount, payment.seller_id, charge_id);
  }else {
    rejectCharge(charge_id)
  }

   try {
    let shipmentUrl = new URL("/mocks/shipment", req.url).toString();
    if (shipmentUrl.includes("localhost") && shipmentUrl.startsWith("https://")) {
      shipmentUrl = shipmentUrl.replace("https://", "http://");
    }
    const shipmentResponse = await fetch(shipmentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        charge_id,
        status,
      }),
    });
    if (!shipmentResponse.ok) {
      console.error("Failed to notify shipment API:", shipmentResponse.statusText);
    }
  } catch (error) {
    console.error("Error notifying shipment API:", error);
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


