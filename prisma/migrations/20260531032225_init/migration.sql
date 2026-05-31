-- CreateTable
CREATE TABLE "balance_logs" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255),
    "amount_change" DECIMAL(15,2) NOT NULL,
    "previous_balance" DECIMAL(15,2) NOT NULL,
    "new_balance" DECIMAL(15,2) NOT NULL,
    "transaction_type" VARCHAR(50),
    "reference_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" VARCHAR(255),
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50),
    "mp_payment_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" VARCHAR(255),
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50),
    "charge_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "clerk_id" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("clerk_id")
);

-- AddForeignKey
ALTER TABLE "balance_logs" ADD CONSTRAINT "balance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("clerk_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("clerk_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
