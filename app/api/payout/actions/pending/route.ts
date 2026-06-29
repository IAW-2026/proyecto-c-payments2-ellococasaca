import { NextRequest, NextResponse } from 'next/server';
import { pendCharge, pendPayout, searchPayout } from '@/app/lib/actions';

export async function POST(
     request: NextRequest,
) {
    const body = await request.json();
    const { charge_id } = body;

const secret = process.env.INTER_SERVICE_SECRET;
  const secretHeader = request.headers.get('x-inter-service-secret');

  if(!secretHeader || secretHeader !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

    if (!charge_id) {
        return NextResponse.json({ error: 'Charge ID is missing' }, { status: 400 });
    }

    if (!charge_id) {
        return NextResponse.json({ error: 'Charge ID is missing' }, { status: 400 });
    }

    try {
        // First, confirm the payout exists to ensure data consistency.
        const payoutResult = await searchPayout(charge_id);
        const payout = Array.isArray(payoutResult) ? payoutResult[0] : undefined;

        if (!payout) {
            return NextResponse.json({ error: 'Payout not found for this charge ID' }, { status: 404 });
        }

        // Update the status for both the payout and the original charge to 'pendiente'.
        await pendPayout(charge_id);
        await pendCharge(charge_id);

        return NextResponse.json({ message: 'Payout status set to pending successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error setting payout to pending:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to set payout to pending', details: errorMessage },
            { status: 500 }
        );
    }
}