import './globals.css'

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/components/app/providers'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'AurumIQ — Car Pricing Intelligence',
  description: 'Premium market, pricing, and volume intelligence for automotive OEMs (MVP).'
}

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('aurum-theme');
    var theme = t || 'office';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
