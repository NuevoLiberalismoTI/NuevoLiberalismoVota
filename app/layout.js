import './globals.css'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: 'Nuevo Liberalismo Vota',
  description: 'Plataforma de votación del Nuevo Liberalismo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={playfair.variable}>
      <body>{children}</body>
    </html>
  )
}
