import { NextRequest, NextResponse } from 'next/server';
import { acceptPayout, addBalance, searchPayout } from '@/app/lib/actions';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: charge_id } = params;

    if (!charge_id) {
        return NextResponse.json({ error: 'Charge ID is missing' }, { status: 400 });
    }

    try {
        // 1. Find the payout associated with the charge
        const payoutResult = await searchPayout(charge_id);
        const payout = Array.isArray(payoutResult) ? payoutResult[0] : undefined;

        if (!payout) {
            return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
        }

        if (!payout.seller_id || payout.amount === null) {
            return NextResponse.json({ error: 'Payout data is incomplete' }, { status: 400 });
        }

        // 2. Mark the payout as accepted ('pagado')
        await acceptPayout(charge_id);

        // 3. Add the amount to the seller's balance
        await addBalance(payout.seller_id, Number(payout.amount));

        return NextResponse.json({ message: 'Charge accepted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error accepting charge:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to accept charge', details: errorMessage },
            { status: 500 }
        );
    }
}
