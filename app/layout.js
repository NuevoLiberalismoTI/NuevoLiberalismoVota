import './globals.css'
import { Playfair_Display, Montserrat } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata = {
  title: 'Nuevo Liberalismo Vota',
  description: 'Plataforma de votación del Nuevo Liberalismo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
