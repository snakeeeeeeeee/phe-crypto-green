import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'CryptoGreen - Privacy-Protected Climate Donation Platform',
  description: 'Anonymous climate protection donation platform based on PHE technology, protecting privacy while supporting environmental projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}