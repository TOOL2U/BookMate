import type { Metadata } from 'next';
import '../print-styles.css';

export const metadata: Metadata = {
  title: 'Shared Report | BookMate',
  description: 'View shared financial report',
};

export default function SharedReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
