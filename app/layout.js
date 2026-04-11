import './globals.css';

export const metadata = {
  title: 'Ved Logistics — Delivery Portal',
  description: 'Ved Logistics Management System — Manage dispatch, tracking & team operations',
  icons: {
    icon: '/icon.jpg',
    shortcut: '/icon.jpg',
    apple: '/icon.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
