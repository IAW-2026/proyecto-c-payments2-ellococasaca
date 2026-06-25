import { NextRequest, NextResponse } from 'next/server';
import { acceptPayout, addBalance, searchPayout } from '@/app/lib/actions';

export async function POST(
     request: NextRequest,
) {
    const body = await request.json();
    const { charge_id } = body;
    if (!charge_id) {
        return NextResponse.json({ error: 'Charge ID is missing' }, { status: 400 });
    }

    if (!charge_id) {
        return NextResponse.json({ error: 'Charge ID is missing' }, { status: 400 });
    }

    try {
        const payoutResult = await searchPayout(charge_id);
        const payout = Array.isArray(payoutResult) ? payoutResult[0] : undefined;

        if (!payout) {
            return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
        }

        if (!payout.seller_id || payout.amount === null) {
            return NextResponse.json({ error: 'Payout data is incomplete' }, { status: 400 });
        }
        await acceptPayout(charge_id);
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