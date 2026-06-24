'use client'
import { searchAllPayoutsByUser } from "@/app/lib/actions"
import { NextResponse } from "next/server";

export async function GET({
    params,
    }: {
        params: { seller_id: string };
    }){
    const { seller_id: seller_id } = params;
    const response = await searchAllPayoutsByUser(seller_id)

    return new NextResponse(JSON.stringify({  response  }))
}