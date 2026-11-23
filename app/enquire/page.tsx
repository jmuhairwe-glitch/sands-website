import Enquiry from './Enquiry';
import { enquiryTopic, fishSpecies } from '../../lib/enquiry-topics';
import { pageMetadata } from '../../lib/site';

export const metadata = pageMetadata('Prices, training & enquiries | SANDS Fish Farm', 'Get fingerling and feed prices, calculate training fees, request dates and chat with SANDS.', '/enquire');

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = await searchParams;
  const topic = enquiryTopic(query.topic);
  const species = fishSpecies(query.species);
  const date = topic === 'Training' && typeof query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : '';
  return <Enquiry key={`${topic}-${species}-${date}`} initialDate={date} initialTopic={topic} initialSpecies={species} />;
}
