

import { NextRequest, NextResponse } from 'next/server';
import { searchAllChargesByUser } from "@/app/lib/actions";

export async function GET(
    request: NextRequest, 
    context: { params: Promise<{ buyer_id: string }> }
) {
    const { buyer_id } = await context.params; 
    const response = await searchAllChargesByUser(buyer_id);
    return NextResponse.json({ response });
}
