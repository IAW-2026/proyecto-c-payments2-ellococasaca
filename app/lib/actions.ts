'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from "@prisma/adapter-neon";


const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const FormSchema = z.object({
  buyer_id: z.string({
    message: 'invalid order id',
  }),
  seller_id: z.string({
    message: 'invalid order id',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
});


const CreateCharge = FormSchema;

export async function createCharge(formData: FormData) {
  const validatedFields = CreateCharge.safeParse({
    buyer_id: formData.get('buyer_id'),
    seller_id: formData.get('seller_id'),
    amount: formData.get('amount'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields.',
    };
  }
  
  const { buyer_id, seller_id, amount } = validatedFields.data;
  const mp_id_result = await searchMpId(buyer_id);

  try {
    const charge = await prisma.charges.create({
      data: {
        order_id: '07',
        buyer_id: buyer_id,
        amount: amount,
        status: 'pending',
        mp_payment_id: Array.isArray(mp_id_result) ? mp_id_result[0]?.mp_customer_id : null,
      },
      select: {
        id: true,
      },
    });

    return charge.id;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Charge.',
    };
  }

  // TODO: terminar esto
/*
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');*/
}

export async function searchMpId(buyer_id: string) { 
  try {
    const user = await prisma.users.findUnique({
      where: {
        clerk_id: buyer_id
      },
      select: {
        mp_customer_id: true
      }
    });

    return user ? [user] : [];
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: MercadoPago id not found.',
    };
  }
}

export async function searchCharges(buyer_id: string){
    try {
      const charges = await prisma.charges.findMany({
        where: {
          buyer_id: buyer_id
        }
        });
      return charges ? [charges] : [];
    } catch (error) { 
      console.error(error)
      return{  
        message: 'Database Error'
      }
    }
}

export async function createPayout(formData: FormData,charge_id:string){
  const validatedFields = CreateCharge.safeParse({
    buyer_id: formData.get('buyer_id'),
    seller_id: formData.get('seller_id'),
    amount: formData.get('amount')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields.',
    };
  }

  const { buyer_id, seller_id, amount } = validatedFields.data;

  try {
    const payout = await prisma.payouts.create({
      data: {
        seller_id: seller_id ,
        amount: amount,
        status: 'pending',
        charge_id: charge_id
      },
      select: {
        id: true,
      },
    });

    return payout.id;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Charge.',
    };
  }
}

export async function createBalance(formData: FormData,charge_id:string) {
  const validatedFields = CreateCharge.safeParse({
    buyer_id: formData.get('buyer_id'),
    seller_id: formData.get('seller_id'),
    amount: formData.get('amount')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields.',
    };
  }

  const { buyer_id, seller_id, amount } = validatedFields.data;
  const previous_balance = await getPreviousBalance(buyer_id)
  try {
    const balance = await prisma.balance_logs.create({
      data: {
        user_id:seller_id ,
        amount_change: amount,
        previous_balance: previous_balance,
        new_balance: previous_balance + amount.toPrecision(2),
        transaction_type: 'SALE_REVENUE',
        reference_id: charge_id,
      },
      select: {
        id: true,
      },
    });

    return balance.id;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Charge.',
    };
  }
  
}

export async function getPreviousBalance(buyer_id:string){
  try {
    const payout = await prisma.users.findUnique({
      where: {
        clerk_id: buyer_id
      },
      select: {
        balance: true
      }
    });

    return payout ? payout.balance : 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}
