import { notFound } from 'next/navigation';
import { servicePages, getServicePage } from '../../lib/service-pages';
import { businessData, directionsUrl, farmAddress, pageMetadata, siteUrl, whatsappUrl } from '../../lib/site';
import StructuredData from '../components/StructuredData';
import './service.css';

export const dynamicParams = false;
export function generateStaticParams() { return servicePages.map(page => ({ service: page.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const page = getServicePage((await params).service);
  return page ? pageMetadata(page.title, page.description, `/${page.slug}`) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const page = getServicePage((await params).service);
  if (!page) notFound();
  const url = `${siteUrl}/${page.slug}`;
  return <>
    <StructuredData data={businessData} />
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SANDS Fish Farm', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: page.label, item: url },
    ] }} />
    <header className="siteHeader">
      <div className="container serviceNav">
        <a className="brand" href="/" aria-label="SANDS Fish Farm home"><img src="/sands-logo.jpeg" alt="SANDS Fish Farm" width="220" height="64" /></a>
        <nav aria-label="Main navigation"><a href="/#services">All services</a><a href="/finance">Farm budget</a><a href="/enquire">Enquiries</a></nav>
        <a className="button primary" href="tel:+256772402924">Call SANDS</a>
      </div>
    </header>
    <main className="servicePage">
      <section className="serviceHero">
        <div className="container serviceHeroGrid">
          <div>
            <nav className="serviceBreadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>{page.label}</span></nav>
            <p className="eyebrow">SANDS FISH FARM · KANYANYA, KAMPALA</p>
            <h1>{page.heading}</h1><p className="serviceIntro">{page.intro}</p>
            <a className="button primary" href={page.enquiry}>{page.action} →</a>
          </div>
          <aside className="serviceHighlight"><p className="eyebrow">PLAN YOUR NEXT STEP</p><h2>{page.highlight}</h2><p>{page.highlightNote}</p><a href="/finance">Explore your farm budget →</a></aside>
        </div>
      </section>
      <div className="container serviceBody">
        <article className="serviceArticle">
          {page.prices && <section aria-labelledby="prices-heading"><h2 id="prices-heading">Published prices</h2><div className="servicePrices">{page.prices.map(price => <div className="servicePrice" key={price.label}><h3>{price.label}</h3><strong>{price.price}</strong><p>{price.note}</p></div>)}</div><p className="serviceSmall">Confirm availability, dates and the final quotation before booking or ordering.</p></section>}
          {page.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}</section>)}
          <section className="faqWrap"><h2>Questions before you enquire</h2>{page.questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
          <section className="serviceNext"><h2>Talk through your next step</h2><p>Send your location, requirements and preferred date. The farm team will confirm the arrangements.</p><div className="heroActions"><a className="button primary" href={page.enquiry}>{page.action} →</a><a className="serviceTextLink" href={whatsappUrl(`Hello SANDS, I have a question about ${page.label.toLowerCase()}.`)} target="_blank" rel="noreferrer">Ask on WhatsApp</a></div></section>
        </article>
        <aside className="serviceSidebar">
          <section><h2>Visit SANDS</h2><p>{farmAddress}</p><p>Please call before travelling. Visits, training and site assessments require agreed arrangements and may have fees.</p><a href="tel:+256772402924">+256 772 402924</a><a href="mailto:james@sands.co.ug">james@sands.co.ug</a><a href={directionsUrl} target="_blank" rel="noreferrer">Find the farm on Google Maps →</a></section>
          <nav aria-label="Other SANDS services"><h2>Explore SANDS</h2>{servicePages.filter(other => other.slug !== page.slug).map(other => <a key={other.slug} href={`/${other.slug}`}>{other.label} →</a>)}<a href="/finance">Farm-budget simulator →</a></nav>
        </aside>
      </div>
    </main>
    <footer className="footer"><div className="container footerInner"><span>© 2026 SANDS FISH FARM (U) LIMITED.</span><a href="/">SANDS home</a><a href="/enquire">Prices & enquiries</a></div></footer>
  </>;
}
