import { fetchCMSBlock } from '@/lib/cms';
import ContactClient from './ContactClient';

export const metadata = { title: 'Contact — Aimentra' };

export default async function ContactPage() {
  const cms = await fetchCMSBlock('contact');
  return <ContactClient cms={cms} />;
}
