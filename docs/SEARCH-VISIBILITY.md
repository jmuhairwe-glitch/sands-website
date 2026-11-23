# SANDS search visibility

Updated 3 November 2026.

## Website

- Six public pages cover catfish fingerlings, tilapia fingerlings, training, custom fish feeds, tank systems and starting a fish farm.
- Homepage cards and service-page navigation link to these pages. Each page has its own title, description, canonical URL, social metadata and breadcrumb data.
- LocalBusiness data uses the published Plot 3A address and public contact details. No unverified ratings, opening hours or map coordinates are added.
- The sitemap lists nine public URLs; private feeding and cost tools retain their existing noindex settings.
- Enquiry topics and species are selected on the server. Fingerling links must render fingerling content before JavaScript runs.
- SANDS supplies both floating and sinking feeds customised to customer needs. Feed enquiries capture the requested type. Published feed rates are budget guides; final specification and price require a quotation.

Validation: `npm run build`, `node tests/search-content.mjs`, `node tests/enquiry-security.mjs`.

## Account-dependent follow-up

These tasks are not completed by deploying website code:

1. In the existing Google Business Profile, confirm ownership, the map pin, actual business hours, category, services and the website URL. Do not create a duplicate profile.
2. Confirm that Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala is the correct address and reconcile the FUSE directory's Plot 10 entry through its owner/editor.
3. Submit `https://sands.co.ug/sitemap.xml` in the existing Search Console property and inspect the new pages. Check whether reported redirects or canonical exclusions concern expected URL variants before changing them.
4. Record a Search Console baseline: Uganda, Web, last 28 days, queries/pages, clicks, impressions, CTR and average position. Compare with the next period; this is an average, not a fixed nationwide rank.
5. Record Business Profile calls, website clicks and direction requests separately from website enquiries. Website WhatsApp taps, submitted forms and confirmed business are counted separately.
6. Add genuine farm photographs and video once approved media are available. Obtain consent before publishing identifiable customer testimonials.
7. Request honest reviews from customers without incentives or filtering for positive feedback. Use the existing profile's verified review link.

Suggested directory correction text, for an authorised editor: “Please update SANDS Fish Farm to Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala, Uganda. Website: https://sands.co.ug. Phone: +256 772 402924. WhatsApp: +256 756 188061. Email: james@sands.co.ug. Please confirm opening hours with the farm rather than listing all-day opening.”

No advertising, paid directory listings, customer outreach or recurring monitoring is enabled by this change.

## Website conversions

Use the private website_conversion_report to compare counts by Kampala date, landing page and referring channel. Compare Google traffic by page with Search Console queries for that page over the same dates. Individual search terms are unavailable for individual visitors. Older leads appear as unattributed.

When staff confirm a feed or fingerling sale or a training booking, record one row in enquiry_outcomes using the actual receipt or booking reference, confirmation time and kind. Set enquiry_id to the submitted enquiry UUID or whatsapp_id to the SANDS ref from the customer's WhatsApp message. Use one reference per transaction so a form followed by a WhatsApp conversation is counted once. A tap alone does not confirm a message or sale. The public website has no permission to record outcomes or read tracking records.
