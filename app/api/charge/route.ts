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

    const payoutResult = await createPayout(buyer_id, amount, seller_id, chargeResult)

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
              success: "https://proyecto-c-payments2-ellococasaca.vercel.app/",
              failure: "https://proyecto-c-payments2-ellococasaca.vercel.app/",
              pending: "https://proyecto-c-payments2-ellococasaca.vercel.app/"
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
