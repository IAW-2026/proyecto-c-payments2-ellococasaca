import { NextResponse } from 'next/server';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from "@prisma/adapter-neon";

export async function GET() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // Seed Users
    const user1 = await prisma.users.upsert({
      where: { clerk_id: 'user_seed_1' },
      update: {},
      create: {
        clerk_id: 'user_3EHhWUTnr0AGzQzMYjtE3D7VCzU',
        balance: 1000.00,
      }
    });

    const user2 = await prisma.users.upsert({
      where: { clerk_id: 'user_seed_2' },
      update: {},
      create: {
        clerk_id: 'user_3EHh...',
        balance: 500.00,
      }
    });

    // Seed Charges
    const charge1 = await prisma.charges.create({
      data: {
        buyer_id: user1.clerk_id,
        amount: 150.00,
        status: 'approved',
      }
    });

    const charge2 = await prisma.charges.create({
      data: {
        buyer_id: user2.clerk_id,
        amount: 75.50,
        status: 'pending',
      }
    });

    // Seed Payouts
    const payout1 = await prisma.payouts.create({
      data: {
        seller_id: user2.clerk_id,
        amount: 135.00,
        status: 'paid',
        charge_id: charge1.id
      }
    });

    return NextResponse.json({ 
      message: 'Database seeded successfully', 
      data: { user1, user2, charge1, charge2, payout1 } 
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
