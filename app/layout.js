import './globals.css'

export const metadata = {
  title: 'Comart Feedback',
  description: 'Creato con amore',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  )
}
