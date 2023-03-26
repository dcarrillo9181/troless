import './globals.css'

export const metadata = {
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
      <body>{children}</body>
    </html>
  )
}
