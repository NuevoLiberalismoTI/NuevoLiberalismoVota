import './globals.css'

export const metadata = {
  title: 'Nuevo Liberalismo Vota',
  description: 'Plataforma de votación del Nuevo Liberalismo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
