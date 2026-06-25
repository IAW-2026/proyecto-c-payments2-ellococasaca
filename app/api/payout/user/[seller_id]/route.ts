

import { NextRequest, NextResponse } from "next/server";
import { searchAllPayoutsByUser } from "@/app/lib/actions";

export async function GET(
    request: NextRequest, // 1er parámetro: La petición
    context: { params: Promise<{ seller_id: string }> } // 2do parámetro: El contexto con los params asíncronos
) {
    // Await obligatorio para los parámetros en Next.js 15+
    const { seller_id } = await context.params;

    // Ejecutamos la acción de búsqueda
    const response = await searchAllPayoutsByUser(seller_id);

    // Utilizamos el método .json() que es más limpio y directo
    return NextResponse.json({ response });
}