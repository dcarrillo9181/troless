import './globals.css'

export const metadata = {
  title: 'Troless',
  description: 'The Next Gen Social Media',
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
