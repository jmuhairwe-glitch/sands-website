import type { Metadata } from 'next';
import FarmOS from './FarmOS';
export const metadata: Metadata = { title: 'FarmOS by SANDS | Feed Calculator', description: 'Calculate feed ingredient quantities and costs, save formulas on your device, and request a SANDS quote.' };
export default function Page() { return <FarmOS />; }
