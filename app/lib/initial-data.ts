//import bcrypt from 'bcrypt';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedTestData() {

  try {
    console.log("Insertando datos de prueba...");

    // 1. Insertar Usuarios de prueba
    // Usuario 1: Un comprador con saldo inicial
    // Usuario 2: Un vendedor que recibirá fondos
    await client`
      INSERT INTO users (clerk_id, mp_customer_id, balance)
      VALUES 
        ('user_2pLq...', 'cus_123456', 500.00),
        ('user_2mRt...', 'cus_789012', 0.00)
      ON CONFLICT (clerk_id) DO NOTHING;
    `;

    // 2. Insertar un Cargo (Venta realizada)
    // El usuario 1 compra algo de 100.00
    const chargeId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    await client`
      INSERT INTO charges (id, order_id, buyer_id, amount, status, mp_payment_id)
      VALUES (
        ${chargeId}, 
        'ORD-999', 
        'user_2pLq...', 
        100.00, 
        'approved', 
        'mp_pay_888'
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    // 3. Insertar una Liquidación (Payout)
    // El usuario 2 recibe el dinero de esa venta (menos una supuesta comisión)
    const payoutId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    await client`
      INSERT INTO payouts (id, seller_id, amount, status, charge_id)
      VALUES (
        ${payoutId}, 
        'user_2mRt...', 
        95.00, 
        'paid', 
        ${chargeId}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    // 4. Actualizar el saldo del Vendedor y crear Log de Auditoría
    // Simulamos que el vendedor (user_2mRt) ahora tiene 95.00
    await client`
      UPDATE users 
      SET balance = balance + 95.00, updated_at = NOW() 
      WHERE clerk_id = 'user_2mRt...';
    `;

    await client`
      INSERT INTO balance_logs (user_id, amount_change, previous_balance, new_balance, transaction_type, reference_id)
      VALUES (
        'user_2mRt...', 
        95.00, 
        0.00, 
        95.00, 
        'SALE_REVENUE', 
        ${payoutId}
      );
    `;

    console.log("¡Datos de prueba insertados con éxito!");
  } catch (error) {
    console.error("Error al insertar datos de prueba:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedTestData();