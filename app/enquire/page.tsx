import type { Metadata } from 'next';
import Enquiry from './Enquiry';
export const metadata: Metadata = { title: 'Prices, training & enquiries | SANDS Fish Farm', description: 'Get fingerling and feed prices, calculate training fees, request dates and chat with SANDS.', alternates: { canonical: 'https://sands.co.ug/enquire' } };
export default function Page() { return <Enquiry/>; }
