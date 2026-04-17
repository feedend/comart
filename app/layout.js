import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        {/* Carichiamo Tailwind da CDN come backup estremo */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  )
}
