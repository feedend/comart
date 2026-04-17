import "./globals.css";

export const metadata = {
  title: "COMART Feedback",
  description: "Sistema di valutazione corsi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
