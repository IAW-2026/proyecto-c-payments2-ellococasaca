'use server'

import { NextRequest, NextResponse } from 'next/server'
import {createCharge} from '../../lib/actions'
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: NextRequest) {
    
}