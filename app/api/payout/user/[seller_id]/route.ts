

import { NextRequest, NextResponse } from "next/server";
import { searchAllPayoutsByUser } from "@/app/lib/actions";

export async function GET(
    request: NextRequest, // 1er parámetro: La petición
    context: { params: Promise<{ seller_id: string }> } // 2do parámetro: El contexto con los params asíncronos
) {
const secret = process.env.INTER_SERVICE_SECRET;
  const secretHeader = request.headers.get('x-inter-service-secret');

  if(!secretHeader || secretHeader !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

    // Await obligatorio para los parámetros en Next.js 15+
    const { seller_id } = await context.params;

    // Ejecutamos la acción de búsqueda
    const response = await searchAllPayoutsByUser(seller_id);

    // Utilizamos el método .json() que es más limpio y directo
    return NextResponse.json({ response });
}