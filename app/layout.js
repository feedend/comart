import './globals.css'
export const metadata = {
  title: 'FeedEnd PWA',
  description: 'Sistema di feedback anonimo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
