import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { QuickCheckInModal } from '@/components/QuickCheckInModal';

export const metadata: Metadata = {
  title: 'QGYM - Centralized Multi-Branch System',
  description: 'نظام إدارة الجيم المركزي متعدد الفروع',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#f7f8fa] text-gray-900 min-h-screen font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
        <Providers>
          <div className="flex min-h-screen bg-[#f7f8fa]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 mr-60">
              <Header />
              <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
          <QuickCheckInModal />
        </Providers>
      </body>
    </html>
  );
}
