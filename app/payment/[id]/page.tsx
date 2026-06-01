'use client'

import React from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const resolvedParams = React.use(params);

  console.log('Received params:', resolvedParams);
  initMercadoPago('APP_USR-9f19cfb8-e586-4450-beb9-779bb8563d86');
  console.log('MercadoPago SDK initialized');
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col items-center justify-center text-center">
        
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          Checkout
        </span>

        <h1 className="text-4xl text-gray-900 font-black uppercase italic tracking-tighter mb-4">
          Pago Seguro
        </h1>
        
        <p className="text-gray-500 font-medium mb-8">
          Haz clic en el botón para procesar tu transacción de forma rápida con Mercado Pago.
        </p>
        
        <div className="w-full max-w-[300px]">
          <Wallet initialization={{ preferenceId: resolvedParams.id }} />
        </div>
      </div>
    </div>
  );
}