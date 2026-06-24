'use client'
import { searchAllChargesByUser } from "@/app/lib/actions"

export async function GET({
    params,
    }: {
        params: { buyer_id: string };
    }){
    const { buyer_id } = params;
    const response = await searchAllChargesByUser(buyer_id)

    return new Response(JSON.stringify({  response  }))
}