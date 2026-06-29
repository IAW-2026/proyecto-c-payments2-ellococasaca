import { NextResponse } from 'next/server';
import { searchAllCharges, searchAllPayouts } from '@/app/lib/actions';

export async function GET() {
    const [charges, payouts] = await Promise.all([
        searchAllCharges(),
        searchAllPayouts()
    ]);

    return NextResponse.json({
        charges,
        payouts
    });
}
