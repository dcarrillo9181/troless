import { SignupSteps } from '../components/SignupSteps'
import { authError } from '@/lib/messages'

export default function JoinPage({ searchParams }: { searchParams: { error?: string } }) {
  return <SignupSteps mode="email" endpoint="/api/auth/register" initialError={authError(searchParams.error)} />
}
