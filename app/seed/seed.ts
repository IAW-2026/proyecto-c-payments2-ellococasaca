import postgres from 'postgres';

async function seedDatabase() {

const client = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
try {
    // Extensión para generar UUIDs si se prefiere sobre IDs seriales
    await client`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Creación de Tabla Usuarios con Saldo
    await client`
      CREATE TABLE IF NOT EXISTS users (
        clerk_id VARCHAR(255) PRIMARY KEY,
        mp_customer_id VARCHAR(255),
        balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabla de Cargos (Pagos recibidos)
    await client`
      CREATE TABLE IF NOT EXISTS charges (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        buyer_id VARCHAR(255) REFERENCES users(clerk_id),
        amount NUMERIC(15, 2) NOT NULL,
        status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
        mp_payment_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabla de Liquidaciones (Payouts)
    await client`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        seller_id VARCHAR(255) REFERENCES users(clerk_id),
        amount NUMERIC(15, 2) NOT NULL,
        status VARCHAR(50) CHECK (status IN ('pending', 'paid')),
        charge_id UUID REFERENCES charges(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabla de Auditoría de Saldo (Balance Logs)
    // CRITICAL: Esto garantiza que puedas reconstruir el saldo si hay discrepancias.
    await client`
      CREATE TABLE IF NOT EXISTS balance_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(clerk_id),
        amount_change NUMERIC(15, 2) NOT NULL,
        previous_balance NUMERIC(15, 2) NOT NULL,
        new_balance NUMERIC(15, 2) NOT NULL,
        transaction_type VARCHAR(50), 
        reference_id VARCHAR(255), 
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedDatabase();

/* pequeña explicacion, tabla charges es la que cobra y payouts la que le da al vendedor, tengo que ver como pegar eso
y el balance muestra todos los cambios para fijarse que no falte nada*/