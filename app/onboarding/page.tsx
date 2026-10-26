import { redirect } from 'next/navigation'
import { SignupSteps } from '../components/SignupSteps'
import { readPending } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  const pending = readPending()
  if (!pending) redirect('/join')
  return (
    <SignupSteps
      mode="google"
      endpoint="/api/auth/onboarding"
      defaultName={pending.name}
      lockedEmail={pending.email}
    />
  )
}
