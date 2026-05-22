'use server'

import { NextRequest, NextResponse } from 'next/server'
import {createCharge, createBalance, createPayout} from '../../lib/actions'
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  let url=""
  try {
    const body = await req.json()

    // Datos enviados por la otra app
    const {
      buyer_id,
      seller_id,
      amount,
    } = body

    // Validaciones básicas
    if (!amount) {
      return NextResponse.json(
        { error: 'Missing data' },
        { status: 400 }
      )
    }

    //guardar pago en DB
    const data = new FormData()
    if (buyer_id) data.append('buyer_id', buyer_id)
    data.append('seller_id', seller_id)
    data.append('amount', amount.toString())

    const chargeResult = await createCharge(data)

    if (typeof chargeResult !== 'string') {
       return NextResponse.json(
       { error: chargeResult?.message || 'Failed to create charge' },
        { status: 400 }
        )
    }

    const payoutResult = await createPayout(data, chargeResult)

    console.log("anashe")
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_token!});

    // 3. Estructuramos el payload (los datos) que exige MercadoPago
    const preferenceData = {
     body: {
        items: [
          {
            id: "item-ID-1234",
            title: "titulo",
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "ARS", // O la moneda correspondiente (MXN, CLP, BRL, etc.)
          }
        ],
      // EL ENLACE VITAL: Este es el ID de tu base de datos.
      // Es clave para saber a quién pertenece el dinero cuando llegue el Webhook.

        external_reference: chargeResult, 
  
            // URLs de retorno: A dónde vuelve el usuario tras pagar
            back_urls: {
              success: "https://proyecto-c-payments2-ellococasaca-dye6q58q6.vercel.app",
              failure: "https://proyecto-c-payments2-ellococasaca-dye6q58q6.vercel.app",
              pending: "https://proyecto-c-payments2-ellococasaca-dye6q58q6.vercel.app"
            },
            auto_return: "approved", // Redirige automáticamente si es exitoso
  
            // Aquí le indicas a MercadoPago a dónde debe enviar el Webhook que vimos antes
            notification_url: "https://maroon-dawdler-tug.ngrok-free.dev/api/notification"
          }
  };
  
  // 4. Enviamos los datos a MercadoPago para crear el intento de pago
  const preference = new Preference(client);
  const result = await preference.create(preferenceData);

      // 5. Devolvemos al frontend el enlace de pago generado por MercadoPago
      /*return NextResponse.json({ 
        id_preferencia: result.id,
        init_point: result.init_point // URL para redirigir al usuario
      });*/ 
  
  console.log(result.id)
  url = result.id!
  
  
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  } 
  
  revalidatePath('/payment');
  return NextResponse.json({ url: `/payment/${url}` });
}
/*
Request {
  method: 'POST',
  url: 'https://proyecto-c-payments2-ellococasaca-cd9xd5kye.vercel.app/api/notification?data.id=160257234984&type=payment',
  headers: Headers {
    'x-b3-traceid': '000000000000000024e5746610f2423a',
    'x-signature': 'ts=1779330686,v1=0da287d0d99aaca5ea187864c7f9538e7cdd01d08eb47ef8e758d682a65feb3c',
    'x-vercel-ja4-digest': 't13d131100_f57a46bbacb6_ab7e3b40a677',
    referer: 'https://mercadopago.com.ar',
    'x-forwarded-host': 'proyecto-c-payments2-ellococasaca-cd9xd5kye.vercel.app',
    'x-vercel-id': 'iad1::cgv5t-1779330686791-b514b738acf6',
    'user-agent': 'MercadoPago WebHook v1.0 payment',
    'x-vercel-ip-timezone': 'America/New_York',
    'x-vercel-oidc-token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9.eyJhdWQiOiJodHRwczpcL1wvdmVyY2VsLmNvbVwvc2ltb25wYWlsbGFucy1wcm9qZWN0cyIsImlzcyI6Imh0dHBzOlwvXC9vaWRjLnZlcmNlbC5jb21cL3NpbW9ucGFpbGxhbnMtcHJvamVjdHMiLCJleHAiOjE3NzkzMzM4MjMsInByb2plY3QiOiJwcm95ZWN0by1jLXBheW1lbnRzMi1lbGxvY29jYXNhY2EiLCJlbnZpcm9ubWVudCI6InByZXZpZXciLCJvd25lcl9pZCI6InRlYW1fcEw2cVVKQ0NocDQ1T3c0ZEN3VWx5czJnIiwib3duZXIiOiJzaW1vbnBhaWxsYW5zLXByb2plY3RzIiwic2NvcGUiOiJvd25lcjpzaW1vbnBhaWxsYW5zLXByb2plY3RzOnByb2plY3Q6cHJveWVjdG8tYy1wYXltZW50czItZWxsb2NvY2FzYWNhOmVudmlyb25tZW50OnByZXZpZXciLCJzdWIiOiJvd25lcjpzaW1vbnBhaWxsYW5zLXByb2plY3RzOnByb2plY3Q6cHJveWVjdG8tYy1wYXltZW50czItZWxsb2NvY2FzYWNhOmVudmlyb25tZW50OnByZXZpZXciLCJpYXQiOjE3NzkzMzAyMjMsInBsYW4iOiJob2JieSIsIm5iZiI6MTc3OTMzMDIyMywicHJvamVjdF9pZCI6InByal9Ka2daU0JrZmNkaTcwUllCSjdibUFpMFp4NnJJIn0.J_Qpq_LgNsWcOmUsTCVqlSGq22gTKcRdes_LAeF3JoBgoqgXILa7qux-O1xdDUV51GaKYr45o3mtm3jBr3m9dd09rVoePGSyCe5Ay14ygcLQY9Nd51RjZGLmD_xq57LWv7qXy9-ayj9OV7yPqSMn7Y_yE7bezIgWsX-SChG7HUBlNXYRtLhU6VviGG0uJ3pfr5cXRJw8dSc52KxyM8RaA3CsveX_r44Hrzr3KIKc6FebtdLGOsn-bc5U3sXVBFnZt11wFov9KeNWBXfT14LCGcl_KFli5VjpBDcmGWbOdogih-5yQ46HVyaZ-6p8rBclEXj8YGzHviCHyH0CGkPt8g',
    'x-matched-path': '/api/notification',
    'x-vercel-forwarded-for': '35.245.20.104',
    'x-vercel-sc-headers': '{"x-vercel-function-platform":"vercel\\/proxy+serverless","Authorization":"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZXBsb3ltZW50SWQiOiJkcGxfN0RKNXRYSGY0NGd1cVg4bUphRUNxaVR1dTdtQiIsInVubGltaXRlZCI6ZmFsc2UsInByb2plY3RJZCI6InByal9Ka2daU0JrZmNkaTcwUllCSjdibUFpMFp4NnJJIiwicmVxdWVzdElkIjoiY2d2NXQtMTc3OTMzMDY4Njc5MS1iNTE0YjczOGFjZjYiLCJvd25lcklkIjoidGVhbV9wTDZxVUpDQ2hwNDVPdzRkQ3dVbHlzMmciLCJkb21haW4iOiJwcm95ZWN0by1jLXBheW1lbnRzMi1lbGxvY29jYXNhY2EtY2Q5eGQ1a3llLnZlcmNlbC5hcHAiLCJleHAiOjE3NzkzMzE2MDYsImlhdCI6MTc3OTMzMDY4NiwibmV4dFZlcnNpb24iOiIxNi4yLjYiLCJpc3MiOiJzZXJ2ZXJsZXNzIiwiZW52IjoicHJldmlldyIsImJsb2NrIjpmYWxzZSwicGxhbiI6ImhvYmJ5In0.BXloIAG9fVeezPccC-uH5cmaKXDvtctop1xQjt9y27I","x-vercel-ept":"0"}',
    'x-socket-timeout': '25000',
    'x-vercel-ip-continent': 'NA',
    'x-vercel-enable-rewrite-caching': '1',
    host: 'proyecto-c-payments2-ellococasaca-cd9xd5kye.vercel.app',
    'x-b3-sampled': '0',
    'x-vercel-proxy-signature-ts': '1779330986',
    'x-vercel-sc-host': 'iad1.suspense-cache.vercel-infra.com',
    'x-rest-pool-name': 'pool_unknown',
    'x-vercel-ip-country': 'US',
    'content-type': 'application/json',
    'x-request-id': 'c8813b07-3a3e-406d-a608-917c1f879bef',
    'x-real-ip': '35.245.20.104',
    'x-vercel-ip-longitude': '-77.0365',
    accept: 'application/json',
    'x-vercel-ip-as-number': '396982',
    'x-vercel-sc-basepath': '',
    'x-vercel-proxy-signature': 'Bearer 4d3a882f9fa29ce31dd9cb749ab3464309358427292587bc930d0c7d54c4bf5f',
    forwarded: 'for=35.245.20.104;host=proyecto-c-payments2-ellococasaca-cd9xd5kye.vercel.app;proto=https;sig=0QmVhcmVyIDRkM2E4ODJmOWZhMjljZTMxZGQ5Y2I3NDlhYjM0NjQzMDkzNTg0MjcyOTI1ODdiYzkzMGQwYzdkNTRjNGJmNWY=;exp=1779330986',
    'accept-encoding': 'gzip',
    'x-vercel-deployment-url': 'proyecto-c-payments2-ellococasaca-cd9xd5kye.vercel.app',
    traceparent: '00-000000000000000024e5746610f2423a-d7b6a989e280e705-00',
    'x-trace-digest-36': 'd8rxEvf81hv99zcUVk/T9SX6/wmQbmg0dP5o3zTjwOWyM1MG4uTwni9e7YVqTVqVIq9bGZpinhiv8YOFJOUew9bP9tvpEQlnK/wVTL8kA6Ix+nDcUQ5iyG5n8PZQ1f7g',
    'x-vercel-ip-country-region': 'DC',
    'x-vercel-ip-city': 'Washington',
    'content-length': '189',
    'x-forwarded-proto': 'https',
    'x-forwarded-for': '35.245.20.104',
    'x-vercel-proxied-for': '35.245.20.104',
    'x-b3-spanid': 'd7b6a989e280e705',
    'x-vercel-ip-postal-code': '56972',
    'x-vercel-ip-latitude': '38.894',
    connection: 'close',
    'x-invocation-id': 'iad1::cgv5t-1779330686791-b514b738acf6'
  },
  destination: '',
  referrer: 'about:client',
  referrerPolicy: '',
  mode: 'cors',
  credentials: 'same-origin',
  cache: 'default',
  redirect: 'follow',
  integrity: '',
  keepalive: false,
  isReloadNavigation: false,
  isHistoryNavigation: false,
  signal: AbortSignal { aborted: false }
}*/