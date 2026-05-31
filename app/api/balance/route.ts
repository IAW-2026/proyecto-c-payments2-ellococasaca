import { getPreviousBalance } from "@/app/lib/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Retrieve the clerk_id from the URL query parameters
    const clerk_id = req.nextUrl.searchParams.get("clerk_id");

    if (!clerk_id) {
      return NextResponse.json(
        { error: "Missing clerk_id parameter" },
        { status: 400 }
      );
    }

    // Reuse your existing action that fetches the balance from Prisma using clerk_id
    const balance = await getPreviousBalance(clerk_id);
    console.log(balance)

    return NextResponse.json({ balance }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}