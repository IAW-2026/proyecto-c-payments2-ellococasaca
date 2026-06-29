

import { NextRequest, NextResponse } from 'next/server';
import { searchAllChargesByUser } from "@/app/lib/actions";

export async function GET(
    request: NextRequest, 
    context: { params: Promise<{ buyer_id: string }> }
) {
const secret = process.env.INTER_SERVICE_SECRET;
  const secretHeader = request.headers.get('x-inter-service-secret');

  if(!secretHeader || secretHeader !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

    const { buyer_id } = await context.params; 
    const response = await searchAllChargesByUser(buyer_id);
    return NextResponse.json({ response });
}
