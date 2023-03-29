import './globals.css'
import type { Metadata } from 'next'
import Header from './components/Header'

export const metadata: Metadata = {
  title: 'Troless',
  description: 'Empowering Positivity, Inspiring Connections',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
