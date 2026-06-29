'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createCharge, createPayout, syncUser } from '../../lib/actions'
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {

  const secret = process.env.INTER_SERVICE_SECRET;
  const secretHeader = req.headers.get('x-inter-service-secret');

  if(!secretHeader || secretHeader !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let url = ""
  try {
    const body = await req.json()

    const {
      buyer_id,
      seller_id,
      order_id,
      amount,
      products,
      shipping_address,
    } = body

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing data' },
        { status: 400 }
      )
    }
    console.log("Received request body:", body);

    await syncUser(seller_id);
    await syncUser(buyer_id);

    const chargeResult = await createCharge({
      buyer_id,
      seller_id,
      order_id,
      amount,
      products,
      shipping_address,
    })
    console.log("chargeResult:", chargeResult);
     const payoutResult = await createPayout(
      buyer_id,
      amount,
      seller_id,
      chargeResult as string
    );

    if (typeof chargeResult !== 'string') {
      return NextResponse.json(
        { error: chargeResult?.message || 'Failed to create charge' },
        { status: 400 }
      )
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

    const preferenceData = {
      body: {
        items: [
          {
            id: "test",
            title: "Compra en El Loco Casaca",
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "ARS",
          }
        ],
        // EL ENLACE VITAL: Este es el ID de tu base de datos.
        // Es clave para saber a quién pertenece el dinero cuando llegue el Webhook.
        external_reference: chargeResult,

        // URLs de retorno: A dónde vuelve el usuario tras pagar
        back_urls: {
          success: "https://proyecto-c-buyer-ellococasaca.vercel.app/",
          failure: "https://proyecto-c-buyer-ellococasaca.vercel.app/",
          pending: "https://proyecto-c-buyer-ellococasaca.vercel.app/"
        },
        auto_return: "approved", // Redirige automáticamente si es exitoso

        // Aquí le indicas a MercadoPago a dónde debe enviar el Webhook que vimos antes
        notification_url: "https://proyecto-c-payments2-ellococasaca.vercel.app/api/notification",
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

    url = result.id!


  } catch (error) {
    console.error(error)
/*

curl -X POST http://localhost:3000/api/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "user_3Fb3cO7cNjB7131LuBeBOgjJqnf",
    "sellerId": "user_3EXCQQzlvNmKjw9ucIFSOLpKFAh",
    "amount": 25000.50,
    "productIds": [
      "prod_1",
      "prod_2"
    ],
    "shippingAddress": {
      "street": "Av. San Martin 1234",
      "city": "Bahía Blanca",
      "province": "Buenos Aires",
      "postalCode": "8000",
      "country": "Argentina"
    }
  }'

  */
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
  revalidatePath('/payment');
  return NextResponse.json({ url: `/payment/${url}` });
}
