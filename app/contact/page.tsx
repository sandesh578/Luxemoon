import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/settings-server';
import ContactClient from './ContactClient';

// Revalidate every hour — contact info rarely changes
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  // Use static English metadata — locale-specific variants are client-side
  return {
    title: 'Contact Us | Luxe Moon',
    description: 'Connect with Luxe Moon. We are here to help you shine with our premium Korean hair care products.',
  };
}

export default async function ContactPage() {
  const config = await getSiteConfig();

  const formattedConfig = {
    contactPhone: config.contactPhone,
    contactEmail: config.contactEmail,
    contactAddress: config.contactAddress,
    whatsappNumber: config.whatsappNumber,
  };

  return <ContactClient config={formattedConfig} />;
}
