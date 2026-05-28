import { auth } from '@clerk/nextjs/server'
import { SignIn } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function LoginPage() {

   const { isAuthenticated, } = await auth()

  if (isAuthenticated) {
    redirect('/status')
  } else {
  return <SignIn />
  }
}
 