export const metadata = {
  title: 'CrossFit Hells Kitchen',
  description: 'Global Hell Raisers Community',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-screen flex flex-col text-white">
        {children}
      </body>
    </html>
  )
}