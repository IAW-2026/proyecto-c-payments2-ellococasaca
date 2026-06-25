'use server';

import { z } from 'zod';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { PrismaNeon } from "@prisma/adapter-neon";


const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })


const FormSchema = z.object({
  buyer_id: z.string({
    message: 'invalid buyer id',
  }),
  seller_id: z.string({
    message: 'invalid seller id',
  }),
  order_id: z.string().optional(),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
  })).optional(),
  shipping_address: z.unknown().optional(),
});


const CreateCharge = FormSchema;

export async function createCharge(chargeData: {
  buyer_id: string;
  seller_id: string;
  order_id?: string;
  amount: number;
  products?: { productId: string; quantity: number }[];
  shipping_address?: unknown;
}) {
  const validatedFields = CreateCharge.safeParse(chargeData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields.',
    };
  }

  const { buyer_id, seller_id, order_id, amount, products, shipping_address } = validatedFields.data;
  console.log("Creating charge with data:", chargeData);
  try {
    const charge = await prisma.charges.create({
      data: {
        buyer_id: buyer_id,
        order_id: order_id,
        amount: amount,
        status: 'pendiente',
        mp_payment_id: null,
        products: products as Prisma.InputJsonValue,
        shipping_address: shipping_address as Prisma.InputJsonValue,
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
}

export async function getCharge(charge_id: string) {
  try {
    const charge = await prisma.charges.findUnique({
      where: {
        id: charge_id,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        order_id: true,
        created_at: true,
        buyer_id: true,
        mp_payment_id: true,
        products: true,
        shipping_address: true,
      },
    });
    return charge;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function addMPId(charge_id: string, mp_payment_id: string) {
  try {
    const charge = await prisma.charges.update({
      where: {
        id: charge_id
      },
      data: {
        mp_payment_id: mp_payment_id
      }
    });
    return charge;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Update Charge.',
    };
  }
}

export async function searchCharges(buyer_id: string) {
  try {
    const charges = await prisma.charges.findMany({
      where: {
        buyer_id: buyer_id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 9
    });
    const formattedCharges = charges.map((charge) => ({
      ...charge,
      amount: charge.amount?.toString()
    }));
    return [formattedCharges];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function searchAllChargesByUser(buyer_id: string) {
  try {
    const charges = await prisma.charges.findMany({
      where: {
        buyer_id: buyer_id
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    const formattedCharges = charges.map((charge) => ({
      ...charge,
      amount: charge.amount?.toString()
    }));
    return [formattedCharges];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function searchAllCharges() {
  try {
    const charges = await prisma.charges.findMany({
      where: {

      }
    });
    return charges ? [charges] : [];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function updateCharge(charge_id: string) {
  try {
    const charge = await prisma.charges.update({
      where: {
        id: charge_id
      },
      data: {
        status: 'aprobado'
      }
    });
    return charge;
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function pendCharge(charge_id: string) {
  try {
    const charge = await prisma.charges.update({
      where: {
        id: charge_id
      },
      data: {
        status: 'pendiente'
      }
    });
    return charge;
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function rejectCharge(charge_id: string) {
  try {
    const charges = await prisma.charges.update({
      where: {
        id: charge_id
      },
      data: {
        status: 'rechazado'
      }
    });
    return charges ? [charges] : [];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function createPayout(buyer_id: string, amount: number, seller_id: string, charge_id: string) {
  try {
    const payout = await prisma.payouts.create({
      data: {
        seller_id: seller_id,
        amount: amount,
        status: 'pendiente',
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


export async function acceptPayout(charge_id: string) {
  try {
    const existingPayout = await prisma.payouts.findFirst({
      where: {
        charge_id: charge_id
      }
    });
    if (!existingPayout) return [];

    const payout = await prisma.payouts.update({
      where: {
        id: existingPayout.id
      },
      data: {
        status: 'pagado'
      }
    });
    return [payout];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function pendPayout(charge_id: string) {
  try {
    const existingPayout = await prisma.payouts.findFirst({
      where: {
        charge_id: charge_id
      }
    });
    if (!existingPayout) return [];

    const payout = await prisma.payouts.update({
      where: {
        id: existingPayout.id
      },
      data: {
        status: 'pendiente'
      }
    });
    return [payout];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}


export async function rejectPayout(charge_id: string) {
  try {
    const existingPayout = await prisma.payouts.findFirst({
      where: {
        charge_id: charge_id
      }
    });
    if (!existingPayout) return [];

    const payout = await prisma.payouts.update({
      where: {
        id: existingPayout.id
      },
      data: {
        status: 'rechazado'
      }
    });
    return [payout];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}


export async function searchPayout(charge_id: string) {
  try {
    const payout = await prisma.payouts.findFirst({
      where: {
        charge_id: charge_id
      }
    });
    return payout ? [payout] : [];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function searchAllPayoutsByUser(seller_id: string) {
  try {
    const payouts = await prisma.payouts.findMany({
      where: {
        seller_id: seller_id
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    const formattedPayouts = payouts.map((payout) => ({
      ...payout,
      amount: payout.amount?.toString()
    }));
    return [formattedPayouts];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function searchPayoutsByUser(seller_id: string) {
  try {
    const payouts = await prisma.payouts.findMany({
      where: {
        seller_id: seller_id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 9
    });
    const formattedPayouts = payouts.map((payout) => ({
      ...payout,
      amount: payout.amount?.toString()
    }));
    return [formattedPayouts];
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function getAmount(charge_id: string) {
  try {
    const payout = await prisma.payouts.findFirst({
      where: {
        charge_id: charge_id
      },
      select: {
        amount: true
      }
    });
    return payout ? payout.amount : 0;
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error'
    }
  }
}

export async function createBalance(payout_id: string, charge_id: string, amount: number, seller_id: string) {
  const previous_balance = await getPreviousBalance(seller_id!.toString())
  try {
    const balance = await prisma.balance_logs.create({
      data: {
        user_id: seller_id,
        amount_change: amount,
        previous_balance: previous_balance,
        new_balance: Number(previous_balance) + (amount),
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

export async function getPreviousBalance(buyer_id: string) {
  try {

    const payout = await prisma.users.findUnique({
      where: {
        clerk_id: buyer_id
      },
      select: {
        balance: true
      }
    });
    console.log("previous balance:", payout?.balance);
    return payout ? payout.balance : 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function getBuyerId(buyer_id: string) {
  try {
    const payout = await prisma.charges.findUnique({
      where: {
        id: buyer_id
      },
      select: {
        buyer_id: true
      }
    });

    return payout ? payout.buyer_id : 0;
  } catch (error) {
    console.error(error);
    return 0;
  }

}

export async function addBalance(seller_id: string, amount: number) {
  try {
    const user = await prisma.users.findUnique({
      where: {
        clerk_id: seller_id
      },
      select: {
        balance: true
      }
    });

    if (!user) return;

    const newBalance = Number(user.balance) + (amount);

    await prisma.users.update({
      where: {
        clerk_id: seller_id
      },
      data: {
        balance: newBalance
      }
    });
  } catch (error) {
    console.error(error);
  }
}


export async function syncUser(clerk_id: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { clerk_id }
    });
    if (!user) {
      await prisma.users.create({
        data: {
          clerk_id: clerk_id,
          balance: 0,
        }
      });
    }
  } catch (error) {
    console.error('Database Error: Failed to Sync User.', error);
  }
}