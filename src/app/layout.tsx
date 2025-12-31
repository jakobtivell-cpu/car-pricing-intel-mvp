import './globals.css'

import type { Metadata } from 'next'
import { Providers } from '@/components/app/providers'

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
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
