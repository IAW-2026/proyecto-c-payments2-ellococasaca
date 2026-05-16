'use server'

import { NextRequest, NextResponse } from 'next/server'
import {createCharge} from '../../lib/actions'
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: NextRequest) {
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
  /*
          // URLs de retorno: A dónde vuelve el usuario tras pagar
          back_urls: {
            success: "http://localhost:3000",
            failure: "http://localhost:3000",
            pending: "http://localhost:3000"
          },
          auto_return: "approved", // Redirige automáticamente si es exitoso
  */
          // Aquí le indicas a MercadoPago a dónde debe enviar el Webhook que vimos antes
          //notification_url: "http://localhost:3000"
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
  return NextResponse.redirect(
    new URL(`payment/${result.id}`, req.url)
  );

    } catch (error) {
      console.error(error)

      return NextResponse.json(
        { error: 'Error interno' },
        { status: 500 }
      )
    }
}

