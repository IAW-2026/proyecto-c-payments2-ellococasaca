import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { charge_id, status } = await req.json();
    // Process the shipment notification
    return NextResponse.json({ status: "ok" }); 
}