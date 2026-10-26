import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Outfit } from 'next/font/google'
import Header from './components/Header'
import { getSessionUser } from '@/lib/auth'
import { readDb, unreviewedCount } from '@/lib/store'

const sans = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Troless',
  description: 'Short, face-to-face optimism.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  const alerts = user?.isAdmin ? unreviewedCount(await readDb()) : 0
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} flex h-[100svh] flex-col overflow-hidden font-sans text-ink antialiased`}>
        <Header user={user} alerts={alerts} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  )
}
