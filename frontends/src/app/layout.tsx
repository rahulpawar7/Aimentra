import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/providers/QueryProvider';
import AuthProvider from '@/providers/AuthProvider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Aimentra — Learn Smarter with AI-Powered Courses',
    template: '%s | Aimentra',
  },
  description:
    'Aimentra is an intelligent learning platform helping students and professionals master skills with AI-guided courses, personalized progress, and verified certificates.',
  keywords: ['AI learning', 'online courses', 'aimentra', 'skill development', 'certificates', 'Aimentra'],
  authors: [{ name: 'Aimentra' }],
  creator: 'Aimentra',
  publisher: 'Aimentra',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://aimentra.com',
    siteName: 'Aimentra',
    title: 'Aimentra — Learn Smarter with AI-Powered Courses',
    description: 'Master new skills with AI-guided courses, personalized learning paths, and verified certificates.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Aimentra' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aimentra — Learn Smarter with AI',
    description: 'AI-powered courses and personalized learning for students and professionals.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#07070f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: 'white' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: 'white' },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
