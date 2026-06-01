import { SignIn } from '@clerk/nextjs'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<div className="w-full h-96 flex items-center justify-center">Loading...</div>}>
        <SignIn routing="path" path="/login" fallbackRedirectUrl="/status" />
      </Suspense>
    </div>
  )
}
