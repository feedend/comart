import './globals.css'

export const metadata = {
  title: 'Comart Feedback',
  description: 'PWA di feedback anonimo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>{children}</body>
    </html>
  )
}
