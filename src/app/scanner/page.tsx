import type { Metadata } from 'next';
import ScannerLab from '@/components/ScannerLab';
export const metadata: Metadata = { title: 'Scanner Yu-Gi-Oh! · Prova', robots: { index: false, follow: false } };
export default function ScannerPage() { return <ScannerLab />; }
