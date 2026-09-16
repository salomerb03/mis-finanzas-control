import "./globals.css";
import RegistrarServiceWorker from "./RegistrarServiceWorker";

export const metadata = {
  title: "Mis Cuentas",
  description: "Registra tus ingresos y gastos, y mira tu saldo en tiempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mis Cuentas",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#EFF0E4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
