/**
 * app/api/webhook/mercadopago/route.ts
 *
 * Mercado Pago Webhook Receiver (Next.js App Router)
 *
 * Official documentation references:
 * - "Validate notification origin"
 * - "Payment notifications"
 * - Signature template:
 *   id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 *
 * IMPORTANT:
 * - Replace MP_WEBHOOK_SECRET with your Mercado Pago webhook secret.
 * - Persist idempotency keys in Redis or a database in production.
 * - RAW BODY is captured BEFORE JSON parsing.
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";


/**
 * Replace with your Mercado Pago webhook secret.
 * Source: Mercado Pago Developers > Your integrations > Webhooks
 */
const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

if (!MP_WEBHOOK_SECRET) {
  throw new Error("Missing environment variable: MP_WEBHOOK_SECRET");
}

/**
 * Minimal webhook payload typing.
 * Extend according to your integration needs.
 */
interface MercadoPagoWebhookPayload {
  id?: string | number;
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
}

/**
 * In-memory idempotency store.
 *
 * Production recommendation:
 * - Redis SET with TTL
 * - PostgreSQL UNIQUE constraint
 * - DynamoDB conditional write
 *
 * WARNING:
 * This resets on server restart / serverless cold start.
 */
const processedEvents = new Set<string>();

/**
 * POST /api/webhook/mercadopago
 */
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

    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");

    const validSignature =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!validSignature) {
      console.error("Mercado Pago signature verification failed", {
        manifest,
        receivedSignature,
        generatedSignature,
      });

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        { status: 401 }
      );
    }

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

    /**
     * Production recommendation:
     *
     * Persist eventId BEFORE processing:
     *
     * Example:
     * await redis.set(`mp:webhook:${eventId}`, "1", "EX", 86400, "NX")
     */

    // ------------------------------------------------------------
    // STEP 9: Process webhook event
    // ------------------------------------------------------------

    console.log("Mercado Pago webhook received", {
      eventId,
      topic: payload.type,
      action: payload.action,
      dataId: payload?.data?.id,
    });

    /**
     * TODO:
     * Your business logic here.
     *
     * Examples:
     * - Update payment status
     * - Create order
     * - Trigger fulfillment
     * - Emit internal events
     */

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


