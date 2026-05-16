'use client'

import React from 'react';
import Script from 'next/script'
import  App  from './app.js';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Inicializa Mercado Pago con tu Public Key


export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  initMercadoPago('APP_USR-9f19cfb8-e586-4450-beb9-779bb8563d86');
  return (
    
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black-50 border border-black-200 rounded-lg shadow-md p-8 flex flex-col items-center justify-center min-h-[300px] text-black">
        <div ><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
              <h1>Botón de Pago</h1>
              <p>Haz clic en el botón para realizar el pago.</p>
              <div style={{ width: '300px' }}>
                <Wallet initialization={{ preferenceId: resolvedParams.id }} />
              </div>
            </div></div>
      </div>
    </div>
  );
}
