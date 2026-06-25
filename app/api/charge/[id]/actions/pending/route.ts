import { NextRequest, NextResponse } from 'next/server';
import { pendCharge, pendPayout, searchPayout } from '@/app/lib/actions';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: charge_id } = params;

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
