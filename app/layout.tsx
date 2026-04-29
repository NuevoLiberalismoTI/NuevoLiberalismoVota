import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VotaApp - Plataforma de Votación Moderna',
  description: 'Sistema seguro y transparente para realizar votaciones en tiempo real',
  keywords: 'votación, voto, democracia, elecciones, en línea',
  authors: [{ name: 'VotaApp Team' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'VotaApp',
    description: 'Plataforma de votación moderna y segura',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
