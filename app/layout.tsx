import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Source_Sans_3 } from 'next/font/google'
import Header from './components/Header'
import { getSessionUser } from '@/lib/auth'
import { readDb, unreviewedCount } from '@/lib/store'

const sans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
})

const display = Fraunces({
  subsets: ['latin'],
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
      <body className={`${sans.variable} ${display.variable} min-h-screen bg-paper font-sans text-ink antialiased`}>
        <Header user={user} alerts={alerts} />
        <main>{children}</main>
      </body>
    </html>
  )
}
