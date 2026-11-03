import Enquiry from './Enquiry';
import { enquiryTopic, fishSpecies } from '../../lib/enquiry-topics';
import { pageMetadata } from '../../lib/site';

export const metadata = pageMetadata('Prices, training & enquiries | SANDS Fish Farm', 'Get fingerling and feed prices, calculate training fees, request dates and chat with SANDS.', '/enquire');

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = await searchParams;
  const topic = enquiryTopic(query.topic);
  const species = fishSpecies(query.species);
  return <Enquiry key={`${topic}-${species}`} initialTopic={topic} initialSpecies={species} />;
}
