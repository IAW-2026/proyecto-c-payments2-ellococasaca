'use client'

import Link from "next/link";
import { useUser } from '@clerk/nextjs'



export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center bg-zinc-50 font-sans dark:bg-black pt-32">
      <main className="flex flex-col items-center gap-8 px-4 w-full max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
          El loco casaca payment
        </h1>
        
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-white font-medium transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Login
        </Link>
      </main>
    </div>
  );
}
