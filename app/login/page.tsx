import { LoginForm } from '../components/LoginForm'
import { authError } from '@/lib/messages'
import { safeNext } from '@/lib/validators'

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  return <LoginForm initialError={authError(searchParams.error)} next={safeNext(searchParams.next ?? null)} />
}
