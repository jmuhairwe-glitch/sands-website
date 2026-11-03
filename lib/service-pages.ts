export type ServicePage = {
  slug: string;
  title: string;
  description: string;
  label: string;
  heading: string;
  intro: string;
  highlight: string;
  highlightNote: string;
  action: string;
  enquiry: string;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  prices?: { label: string; price: string; note: string }[];
  questions: { question: string; answer: string }[];
};

export const servicePages: ServicePage[] = [
  {
    slug: 'catfish-fingerlings-uganda', label: 'Catfish fingerlings',
    title: 'Catfish Fingerlings in Uganda | Prices & Orders | SANDS',
    description: 'Order catfish fingerlings from SANDS Fish Farm in Kanyanya, Kampala. UGX 500 each. Confirm sizes, quantities, stocking dates and delivery before ordering.',
    heading: 'Catfish fingerlings in Uganda',
    intro: 'Planning your next catfish stocking? Speak to SANDS Fish Farm in Kanyanya, Kampala about the fingerling size, quantity and collection date that fit your pond or tank.',
    highlight: 'UGX 500 per fingerling', highlightNote: 'Available sizes and quantities are confirmed for each order. Transport is quoted separately.',
    action: 'Request catfish fingerlings', enquiry: '/enquire?topic=Fingerlings&species=Catfish',
    sections: [
      { heading: 'Plan the batch before stocking', paragraphs: ['We produce African catfish and work with farmers preparing ponds and tank systems. Tell us where you are, how many fish you need and when your system will be ready. We will confirm the available batch and sizes before you commit.', 'The published price is UGX 500 per fingerling, regardless of collection stage. For example, 1,000 fingerlings cost UGX 500,000 before transport. A price calculation does not reserve fish; availability and final arrangements must be confirmed.'] },
      { heading: 'What to include in your request', bullets: ['Your district, nearest town and phone number.', 'The number of fingerlings and preferred size, or a request for advice on size.', 'Pond or tank dimensions, water source and any circulation or aeration equipment.', 'Your preferred stocking date and whether you will collect or need a delivery quotation.'] },
      { heading: 'Collection and support', paragraphs: ['Collection is from Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala. Agree on a collection time and transport arrangements before travelling.', 'If you are starting out, ask about practical training before stocking. You can discuss tank preparation, feeding, grading, record keeping and water management at the farm. We can also discuss feed supply for the next growth stage.'] },
    ],
    questions: [
      { question: 'Can I order a large batch?', answer: 'Send the quantity and required date. SANDS must confirm batch availability and the collection or delivery plan before accepting an order.' },
      { question: 'Does the fingerling price include delivery?', answer: 'No. The published price is for the fish. Share your location and quantity for a separate transport quotation, or arrange collection from the farm.' },
      { question: 'Can I choose the fingerling size?', answer: 'Include your preferred size in the enquiry. Sizes depend on the available batch and must be confirmed by SANDS.' },
    ],
  },
  {
    slug: 'tilapia-fingerlings-uganda', label: 'Tilapia fingerlings',
    title: 'Tilapia Fingerlings in Uganda | Prices & Orders | SANDS',
    description: 'Enquire about tilapia fingerlings at SANDS Fish Farm, Kampala. UGX 500 each. Confirm batch availability, fish size, collection and delivery arrangements.',
    heading: 'Tilapia fingerlings in Uganda',
    intro: 'Preparing to stock tilapia? SANDS Fish Farm in Kanyanya, Kampala can discuss your pond or tank, the quantity you need and the timing of your next batch.',
    highlight: 'UGX 500 per fingerling', highlightNote: 'Please confirm the available batch, size and production method before ordering. Delivery is extra.',
    action: 'Request tilapia fingerlings', enquiry: '/enquire?topic=Fingerlings&species=Tilapia',
    sections: [
      { heading: 'Choose fish to suit your production plan', paragraphs: ['Tilapia availability follows our production schedule. Contact the farm before arranging transport or setting a stocking date. The team will confirm the available sizes and quantities, and discuss your requirements.', 'Ask about the batch characteristics, breeding method and whether the available fish meet any all-male or strain-specific requirement you have. We do not describe every batch as all-male or genetically improved. Those details must be confirmed for the actual fish offered.'] },
      { heading: 'Price and order information', paragraphs: ['The published price is UGX 500 each, regardless of collection stage. A request for 2,000 tilapia fingerlings therefore has an estimated fish cost of UGX 1,000,000, excluding transport. Use the enquiry calculator for your own quantity.'], bullets: ['Tell us the pond or tank size and whether it is already in use.', 'Include your preferred fish size, quantity and stocking date.', 'Share your water source and location so we can discuss the next steps.', 'Confirm collection or request a delivery quotation before payment or travel.'] },
      { heading: 'Training and feed for your tilapia project', paragraphs: ['Our practical training covers preparing ponds and tanks, stocking, feeding, records and everyday water management. Ask about learning at the farm while you prepare your own system.', 'SANDS also makes tilapia feed to order. Share the fish size and quantity you are keeping so the feed discussion matches your current growth stage. Feed and transport are separate from the fingerling price.'] },
    ],
    questions: [
      { question: 'Are tilapia fingerlings always in stock?', answer: 'Availability varies with the production schedule. Request your quantity and preferred date; SANDS will confirm what is available.' },
      { question: 'Are all batches all-male tilapia?', answer: 'No all-male claim applies to every batch. Ask SANDS to confirm the breeding method and batch characteristics before ordering.' },
      { question: 'Where do I collect?', answer: 'At SANDS Fish Farm, Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala. Please agree on a collection time with the farm first.' },
    ],
  },
  {
    slug: 'fish-farming-training-uganda', label: 'Practical training',
    title: 'Fish Farming Training in Uganda | Kampala Courses | SANDS',
    description: 'Practical fish-farming training at SANDS in Kampala: one-day, two-week residential and two-month hatchery options. View fees and request your preferred date.',
    heading: 'Practical fish-farming training in Kampala',
    intro: 'Bring questions about the farm you want to start or the fish you already keep. Learn at SANDS Fish Farm in Kanyanya through practical sessions around your experience and project.',
    highlight: 'One day from UGX 100,000', highlightNote: 'UGX 350,000 total for a one-day group of 4–10. All dates require confirmation.',
    action: 'Choose a course and request a date', enquiry: '/enquire?topic=Training',
    prices: [
      { label: 'One-day practical', price: 'UGX 100,000 per person', note: 'UGX 350,000 total for 4–10 people.' },
      { label: 'Two-week residential', price: 'UGX 1,400,000 per person', note: 'UGX 4,900,000 total for 4–10 people. Meals and accommodation included.' },
      { label: 'Two-month hatchery', price: 'UGX 5,000,000', note: 'Plus operational costs. Covers catfish and tilapia; fingerling-sharing terms are agreed before starting.' },
    ],
    sections: [
      { heading: 'What you can work on', bullets: ['Preparing a pond or tank and planning a stocking.', 'Feeding, grading fish and keeping useful farm records.', 'Water quality, filtration and everyday tank management.', 'Hatchery work and fingerling management for catfish and tilapia.'] },
      { heading: 'Choose the time you need', paragraphs: ['A one-day session is a starting point for discussing a project or a specific problem. The two-week residential option gives more time at the farm. The two-month hatchery programme focuses on breeding and early fish management, with operational costs agreed separately.', 'Tell us what you want to learn and your current experience. Practical activities depend on what is happening at the farm, so we confirm the session plan, capacity and dates before accepting a booking. Groups above 10 should request a quotation.'] },
      { heading: 'Connect training to your project', paragraphs: ['When a project is booked with SANDS from the beginning, the one-day training fee can be credited towards eligible purchases such as fingerlings or tanks. We confirm the credit in the quotation; it is not automatically deducted online.', 'Clients booking fingerlings and feeds receive priority scheduling. Training can be coordinated with pond preparation and fingerling readiness. Please call before visiting the farm.'] },
    ],
    questions: [
      { question: 'Does selecting a date reserve my place?', answer: 'No. It sends a request. SANDS confirms the dates, capacity, session arrangements and payment details before the booking is accepted.' },
      { question: 'Can four people use the group rate?', answer: 'Yes. The published group rates apply to groups of 4–10 people. Enter your group size in the enquiry calculator.' },
      { question: 'What does the hatchery fee include?', answer: 'The published two-month fee is UGX 5,000,000 plus operational costs. It covers tilapia and catfish hatchery training. The fish produced are shared under terms agreed before starting.' },
    ],
  },
  {
    slug: 'fish-feeds-uganda', label: 'Fish feeds',
    title: 'Catfish & Tilapia Fish Feeds in Uganda | SANDS Kampala',
    description: 'Custom floating and sinking fish feeds from SANDS in Kampala. Discuss species, fish size, pellet type and formulation. Minimum order 500 kg; request a quote.',
    heading: 'Fish feeds for catfish and tilapia in Uganda',
    intro: 'Choose floating or sinking feed around the fish you are keeping. SANDS Fish Farm in Kanyanya, Kampala supplies feeds customised to your species, growth stage and requirements, with the specification and production timing agreed before supply.',
    highlight: 'Floating or sinking feeds', highlightNote: 'Customised to your needs. Minimum order 500 kg; specification, price and transport confirmed in your quotation.',
    action: 'Calculate a feed order', enquiry: '/enquire?topic=Fish%20feeds',
    prices: [
      { label: 'Tilapia feed — guide rate', price: 'UGX 2,900 per kg', note: '500 kg: UGX 1,450,000 at this rate, before transport. Confirm the rate for your chosen feed specification.' },
      { label: 'Catfish feed — guide rate', price: 'UGX 3,500 per kg', note: '500 kg: UGX 1,750,000 at this rate, before transport. Confirm the rate for your chosen feed specification.' },
    ],
    sections: [
      { heading: 'Feed customised to your farm', paragraphs: ['SANDS supplies both floating and sinking feeds. Tell us your preferred type, or ask us to discuss the options for your feeding method and system. We agree on the formulation and pellet size around your species, fish size and requirements.', 'We do not keep ready stock. Please order in advance and agree on the production and collection dates. The published guide rates help you start a budget; SANDS confirms the final price for your chosen floating or sinking feed specification in the quotation.'] },
      { heading: 'Information for a useful quotation', bullets: ['Species: catfish, tilapia or a breakdown for a mixed order.', 'Floating or sinking feed, or a request for help choosing.', 'Average fish weight or growth stage, the number of fish and any formulation requirements.', 'Feed quantity in kilograms, with a minimum order of 500 kg.', 'Required date, district and collection or delivery preference.'] },
      { heading: 'Plan the full feeding period', paragraphs: ['Feed is a recurring cost, so budget beyond the first bag. Record what you feed and how the fish grow, then review the plan as the stock changes. Our farm-budget simulator lets you explore feed costs alongside fingerlings, tanks, water and power.', 'The calculator on the enquiry page shows the goods total at the published rate. SANDS confirms the final specification, production timing and any transport cost before accepting the order.'] },
    ],
    questions: [
      { question: 'Does SANDS supply floating and sinking feed?', answer: 'Yes. SANDS supplies both, customised to the customer’s needs. Specify your preferred type, species and fish size so we can confirm the formulation, pellet size and price.' },
      { question: 'Can I collect feed immediately?', answer: 'Feed is made to order, and ready stock is not maintained. Contact SANDS in advance to confirm production and collection timing.' },
      { question: 'How do I request feed for both species?', answer: 'Include the kilograms required for each species and their growth stages in your enquiry notes. SANDS will confirm the mixed-order quotation.' },
    ],
  },
  {
    slug: 'fish-tanks-uganda', label: 'Fish tanks & RAS',
    title: 'Fish Farming Tanks & RAS Systems in Uganda | SANDS',
    description: 'Plan a fish-farming tank or water-recycling system with SANDS in Kampala. Discuss space, water, filtration, aeration, power and installation requirements.',
    heading: 'Fish-farming tanks and RAS systems in Uganda',
    intro: 'Start with your space, water and production plan. SANDS Fish Farm in Kampala can discuss tanks and recirculating aquaculture systems, including water circulation, filtration and everyday operation.',
    highlight: 'A quotation for your setup', highlightNote: 'Tank size, equipment, site work, transport and installation are confirmed in the quotation.',
    action: 'Discuss my tank system', enquiry: '/enquire?topic=Tanks%20%26%20recycling',
    sections: [
      { heading: 'A tank is one part of the system', paragraphs: ['A recirculating aquaculture system, or RAS, treats and reuses water. The design also needs to account for waste removal, aeration, water replacement and access for cleaning. A tank volume on its own is not a promise of how many fish it can support.', 'We discuss the whole setup before recommending equipment: the fish you want to grow, the intended scale, your available space, water supply and power arrangements. Stocking and feeding plans must fit the actual system.'] },
      { heading: 'Send these details first', bullets: ['Your location and measurements of the available space.', 'Photos of the site and any tanks or equipment you already have.', 'Water source, supply reliability and a place for wastewater to go.', 'Power supply and any backup arrangements.', 'Intended species, production target and available budget.'] },
      { heading: 'Explore the budget, then confirm the design', paragraphs: ['Use the SANDS farm-budget simulator to explore tank numbers, fingerlings, feed and operating assumptions. Its results are estimates for planning, not a fixed quotation or a guarantee of production or profit.', 'Once we understand the site, we can discuss the next steps for an assessment and quotation. Confirm what is included in the package, delivery, installation, training and ongoing supplies before ordering. Site visits and other services may have separate fees.'] },
    ],
    questions: [
      { question: 'Can you help with an existing tank?', answer: 'Yes, send its dimensions, photos, water source and equipment details. Explain the problem or the production goal so SANDS can discuss an assessment.' },
      { question: 'Does a recycling system need fresh water?', answer: 'Water replacement still needs to be planned. The amount depends on the design, fish load, feeding and water quality. The simulator includes assumptions that must be checked for your site.' },
      { question: 'Is the simulator result a final quotation?', answer: 'No. It is an indicative budget. SANDS confirms equipment, installation, site work and operating assumptions separately.' },
    ],
  },
  {
    slug: 'fish-farming-uganda', label: 'Start fish farming',
    title: 'Starting Fish Farming in Uganda | Practical Planning | SANDS',
    description: 'Plan a fish-farming project in Uganda with SANDS: compare ponds and tanks, budget for fingerlings and feed, explore practical training and request advice.',
    heading: 'Starting fish farming in Uganda',
    intro: 'Before buying fish, work through the space, water, feed budget and daily attention your farm will need. SANDS Fish Farm in Kanyanya, Kampala combines hatchery work, grow-out, feed supply, tank systems and practical training.',
    highlight: 'Start with your farm plan', highlightNote: 'Bring your measurements, water-source details and questions. Visits and training require advance arrangements.',
    action: 'Discuss my fish-farming project', enquiry: '/enquire?topic=Something%20else',
    sections: [
      { heading: 'Begin with the site and the market', paragraphs: ['Write down your location, available space, water source and power supply. Decide who you expect to sell fish to and what size they want. A pond, tank or recirculating system should follow those practical requirements.', 'Tell us whether you plan to keep catfish or tilapia, whether you already have infrastructure and how much time someone can spend at the farm each day. We can use that information to discuss training or the next steps for an assessment.'] },
      { heading: 'Budget beyond the tank and the first stocking', bullets: ['Tank or pond preparation, circulation, filtration and aeration where required.', 'Fingerlings, their transport and arrangements for stocking.', 'Feed through the production period, with room for changing requirements.', 'Water, power, labour, cleaning, maintenance and backup arrangements.', 'Harvesting, transport to market and allowance for delays or losses.'] },
      { heading: 'Use actual prices and clear assumptions', paragraphs: ['SANDS publishes fingerlings at UGX 500 each. Floating and sinking feeds are customised to the customer’s needs, with a 500 kg minimum feed order. Published feed guide rates are UGX 2,900/kg for tilapia and UGX 3,500/kg for catfish; confirm the final price for your specification. Fish availability, dates and delivery charges also need confirmation.', 'Our farm-budget simulator lets you change assumptions and see their effect on the budget. Check those assumptions with the farm before investing. Neither a calculator nor a stocking target guarantees the final harvest or profit.'] },
      { heading: 'Learn before committing to a full setup', paragraphs: ['One-day practical training starts at UGX 100,000 per person, or UGX 350,000 total for 4–10 people. Longer residential and hatchery options are also available.', 'Ask about pond or tank preparation, feeding, grading, records and water management. Bring the questions from your own project. Call before visiting Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala.'] },
    ],
    questions: [
      { question: 'How much does it cost to start fish farming?', answer: 'There is no single cost that fits every site. The system, fish numbers, feed period, water, power and labour all affect the budget. Use the simulator for an initial estimate, then request an assessment or quotation.' },
      { question: 'Can I start by attending training?', answer: 'Yes. Share your experience and what you want to learn, then request a one-day session or a longer course. SANDS must confirm the date and arrangements.' },
      { question: 'Can SANDS help after I buy fingerlings?', answer: 'Ask about training, feed supply and support for your setup. Confirm the scope and any fees with SANDS before arranging services.' },
    ],
  },
];

export const getServicePage = (slug: string) => servicePages.find(page => page.slug === slug);
