import './globals.css';

export const metadata = {
  title: 'Ved Logistics — Delivery Portal',
  description: 'Ved Logistics Management System — Manage dispatch, tracking & team operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
