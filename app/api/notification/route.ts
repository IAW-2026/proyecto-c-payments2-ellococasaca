import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        // Obtain the x-signature and x-request-id values from the headers
        const xSignature = request.headers.get('x-signature');
        const xRequestId = request.headers.get('x-request-id')?.trim();

        if (!xSignature || !xRequestId) {
            return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
        }

        // Obtain Query params related to the request URL
        const url = new URL(request.url);
        // Fallback to 'id' if 'data.id' is missing, and ALWAYS lowercase as required by Mercado Pago for alphanumeric IDs
        const dataID = (url.searchParams.get('data.id') || url.searchParams.get('id'))?.trim().toLowerCase();

        if (!dataID) {
            return NextResponse.json({ error: 'Missing data.id or id parameter' }, { status: 400 });
        }

        // Separating the x-signature into parts
        const parts = xSignature.split(',');

        // Initializing variables to store ts and hash
        let ts: string | undefined;
        let hash: string | undefined;

        // Iterate over the values to obtain ts and v1
        parts.forEach((part) => {
            // Split each part into key and value
            const [key, value] = part.split('=');
            if (key && value) {
                const trimmedKey = key.trim();
                const trimmedValue = value.trim();
                if (trimmedKey === 'ts') {
                    ts = trimmedValue;
                } else if (trimmedKey === 'v1') {
                    hash = trimmedValue;
                }
            }
        });

        if (!ts || !hash) {
            return NextResponse.json({ error: 'Invalid x-signature format' }, { status: 400 });
        }
        
        // Obtain the secret key for the user/application from Mercadopago developers site
        // Make sure to trim it to avoid invisible trailing spaces from environment variables
        const secret = (process.env.MERCADOPAGO_WEBHOOK_SECRET || 'your_secret_key_here').trim();

        // Generate the manifest string
        const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;

        // Create an HMAC signature
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);

        // Obtain the hash result as a hexadecimal string
        const sha = hmac.digest('hex');

        if (sha === hash) {
            // HMAC verification passed
            console.log("HMAC verification passed");
            const body = await request.json();
            console.log("Webhook body:", body);
            // TODO: procesar notificacion
            return NextResponse.json({ success: true });
        } else {
            // HMAC verification failed
            console.error("HMAC verification failed");
            const bodyText = await request.text();
            console.log("Webhook body text:", bodyText);
            console.log("MANIFEST:", manifest);
            console.log("MP HASH:", hash);
            console.log("YOUR HASH:", sha);
            console.log("SECRET:", secret);
            console.log("NOTE: If hashes do not match, ensure your MERCADOPAGO_WEBHOOK_SECRET is the 'Secret Key' specifically from the Webhook configuration in the MP Developer Dashboard, NOT your Access Token or Client Secret.");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
