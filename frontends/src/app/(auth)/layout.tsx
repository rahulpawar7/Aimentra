import { redirect } from 'next/navigation';

// Auth layout — no header/footer, centered full-screen
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
