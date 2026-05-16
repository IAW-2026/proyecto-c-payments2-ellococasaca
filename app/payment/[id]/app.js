import React from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Inicializa Mercado Pago con tu Public Key
initMercadoPago('APP_USR-9f19cfb8-e586-4450-beb9-779bb8563d86');

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Botón de Pago</h1>
      <p>Haz clic en el botón para realizar el pago.</p>
      {/* Renderiza el botón de pago */}
      <div style={{ width: '300px' }}>
        <Wallet initialization={{ preferenceId: 'YOUR_PREFERENCE_ID' }} />
      </div>
    </div>
  );
};

export default App;