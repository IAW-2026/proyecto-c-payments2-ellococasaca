'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createCharge, createPayout } from '../../lib/actions'
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  let url = ""
  try {
    const body = await req.json()

    const {
      buyer_id,
      seller_id,
      amount,
    } = body

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing data' },
        { status: 400 }
      )
    }

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

    await createPayout(buyer_id, amount, seller_id, chargeResult)

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_token! });
    console.log('MercadoPago client initialized with access token:', process.env.MP_token);

    const preferenceData = {
      body: {
        items: [
          {
            id: "",
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
          success: "https://proyecto-c-payments2-ellococasaca.vercel.app/",
          failure: "https://proyecto-c-payments2-ellococasaca.vercel.app/",
          pending: "https://proyecto-c-payments2-ellococasaca.vercel.app/"
        },
        auto_return: "approved", // Redirige automáticamente si es exitoso

        // Aquí le indicas a MercadoPago a dónde debe enviar el Webhook que vimos antes
        notification_url: "https://proyecto-c-payments2-ellococasaca.vercel.app/api/notification",
      }
    };
    // 4. Enviamos los datos a MercadoPago para crear el intento de pago
    console.log('Creating MercadoPago preference with data:', preferenceData);
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

    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }

  revalidatePath('/payment');
  return NextResponse.json({ url: `/payment/${url}` });
}
