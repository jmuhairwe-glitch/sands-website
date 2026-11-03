export const enquiryTopics = ['Training', 'Fingerlings', 'Fish feeds', 'Tanks & recycling', 'Something else'] as const;
export type EnquiryTopic = (typeof enquiryTopics)[number];
export type FishSpecies = 'Catfish' | 'Tilapia';

export function enquiryTopic(value: string | string[] | undefined): EnquiryTopic {
  return typeof value === 'string' && enquiryTopics.includes(value as EnquiryTopic)
    ? value as EnquiryTopic : 'Training';
}

export function fishSpecies(value: string | string[] | undefined): FishSpecies {
  return value === 'Tilapia' ? 'Tilapia' : 'Catfish';
}
