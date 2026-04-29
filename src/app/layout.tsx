import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SR Classes',
  description: 'SR Classes — Tuition Centre Management System, Ahmedabad',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "'DM Sans', sans-serif",
        background: '#FAFAF8',
        color: '#1A2332',
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased',
      }}>
        {children}
      </body>
    </html>
  )
}