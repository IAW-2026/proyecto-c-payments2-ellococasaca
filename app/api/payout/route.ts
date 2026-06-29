'use server'

import { NextRequest, NextResponse } from 'next/server'
import { acceptPayout,addBalance,createBalance,rejectPayout, searchPayout } from '../../lib/actions'


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const secret = process.env.INTER_SERVICE_SECRET;
  const secretHeader = req.headers.get('x-inter-service-secret');

  if(!secretHeader || secretHeader !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }


    // Datos enviados por la otra app
    const {
      charge_id,
      status,
    } = body

    if (body.status == 'approved') {
      acceptPayout(body.charge_id)
      const payout = await searchPayout(body.charge_id)
      let payoutId = ""
      let amount 
      let seller_id 
      if( Array.isArray(payout)){
        payoutId = payout[0].id
        amount = payout[0].amount
        seller_id = payout[0].seller_id
      }
      else {
        return NextResponse.json(
          { error: 'Failed to process payout' },
          { status: 500 }
        )
      }
      if (payoutId) {
        createBalance(payoutId, charge_id, Number(amount), seller_id!)
        addBalance(seller_id!, Number(amount))
      }
    }
    else {
      rejectPayout(body.charge_id)
    }

    return NextResponse.json(
      { status: 200 }
    )
  
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 }
    )
  }
}