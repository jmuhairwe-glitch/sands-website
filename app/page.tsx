import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SANDS Fish Farm | Fingerlings, Training & Tank Systems in Kampala",
  description: "Enquire about catfish and tilapia fingerlings, practical fish-farming training and tank systems at SANDS Fish Farm in Kanyanya, Kampala. Call or WhatsApp for availability.",
  alternates: { canonical: "https://sands.co.ug" },
};

const whatsapp = (message: string) => `https://wa.me/256756188061?text=${encodeURIComponent(message)}`;
const fingerlings = whatsapp("Hello SANDS, I found you on sands.co.ug. Please quote for fingerlings. Species: __. Quantity: __. My location: __. Stocking date: __. Please confirm sizes, prices and collection or delivery options.");
const training = whatsapp("Hello SANDS, I found you on sands.co.ug. I am interested in practical fish-farming training. Please send the next dates, fees, duration and topics. My experience: __. Number of people: __.");
const visit = whatsapp("Hello SANDS, I found you on sands.co.ug and would like to arrange a farm visit. Preferred date: __. Number of visitors: __. Purpose: __. Please confirm availability, any fees and directions.");
const directions = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("SANDS FISH FARM Plot 3A Drake Lane Kanyanya Kampala Uganda");

const services = [
  { icon: "🐟", title: "Catfish & Tilapia Hatchery", text: "Ask about available catfish and tilapia fingerling sizes, quantities and prices for your next stocking." },
  { icon: "📈", title: "Grow-out & Intensive Fish Production", text: "Discuss your production plans or enquire about table-fish availability, sizes and prices." },
  { icon: "💧", title: "RAS / Tank Systems", text: "Discuss tanks, water circulation and filtration for your available space and production goals." },
  { icon: "🌾", title: "Fish Feed Development", text: "Discuss feed choices, feeding plans and cost-conscious feed development for your farm." },
  { icon: "👥", title: "Training & Farmer Support", text: "Enquire about practical learning at the farm, with topics suited to your experience and setup." },
  { icon: "♻️", title: "Circular Fish Farming", text: "Learn about our work exploring agricultural uses for fish-farm wastewater and solids." },
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <div className="container navWrap">
          <a className="brand" href="#home" aria-label="SANDS Fish Farm home">
            <img src="/sands-logo.jpeg" alt="SANDS beyond the horizon logo" />
          </a>
          <nav className="nav" aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#services">Our Services</a>
            <a href="#training">Training</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="button primary topButton"
             href="https://wa.me/256756188061"
             target="_blank" rel="noreferrer">
            WhatsApp Us
          </a>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="heroOverlay" />
        <div className="container heroContent">
          <p className="eyebrow">SANDS FISH FARM (U) LIMITED</p>
          <h1>
            Fingerlings. Training.<br />
            <span>Fish farming in Kampala.</span>
          </h1>
          <p className="heroText">
            Planning to stock your pond, start fish farming or improve your tank system? Talk to SANDS in Kanyanya about your next step.
          </p>
          <div className="heroActions">
            <a className="button primary" href={fingerlings} target="_blank" rel="noreferrer">Enquire about fingerlings</a>
            <a className="button outline"
               href="#training">
              Explore training
            </a>
          </div>
          <p className="heroLocation">Plot 3A, Drake Lane, Kanyanya · Off Bahai Road, Kampala</p>
        </div>
      </section>

      <section id="services" className="section services">
        <div className="container">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow blue">OUR SERVICES</p>
              <h2>What can we help you with?</h2>
            </div>
          </div>
          <div className="serviceGrid">
            {services.map((service) => (
              <article className="serviceCard" key={service.title}>
                <div className="serviceIcon" aria-hidden="true">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <a className="serviceLink" href={service.title.includes("Hatchery") ? fingerlings : service.title.includes("Training") ? training : whatsapp(`Hello SANDS, I found you on sands.co.ug. I would like to enquire about ${service.title}. My location: __. My requirements: __.`)} target="_blank" rel="noreferrer">{service.title.includes("Hatchery") ? "Request sizes & prices" : service.title.includes("Training") ? "Ask about training" : "Discuss your requirements"} →</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section about">
        <div className="container aboutGrid">
          <div>
            <p className="eyebrow blue">ABOUT SANDS</p>
            <h2>Growing a Food-Secure Uganda Through Aquaculture</h2>
            <p>
              SANDS FISH FARM (U) LIMITED is a Kampala-based aquaculture enterprise focused on
              sustainable fish production, hatchery operations, modern tank and recirculating systems,
              feed development and farmer training.
            </p>
            <p>
              We are committed to producing healthy fish, building local capacity and promoting
              practical, affordable solutions that make aquaculture work for farmers, communities
              and the environment.
            </p>
            <a className="button primary" href="#contact">Get in Touch →</a>
          </div>
          <div className="aboutPanel">
            <div className="waterMark">SANDS</div>
            <blockquote>“Beyond the Horizon for a Healthier, More Food-Secure Africa.”</blockquote>
            <strong>SANDS FISH FARM (U) LIMITED</strong>
          </div>
        </div>
      </section>

      <section id="training" className="section trainingSection">
        <div className="container aboutGrid">
          <div>
            <p className="eyebrow blue">PRACTICAL FISH-FARMING TRAINING</p>
            <h2>Come with questions about your farm.</h2>
            <p>Whether you are starting out or already keeping fish, tell us what you want to learn. We can discuss a session around your experience and farming plans.</p>
            <ul className="topicList">
              <li>Preparing ponds or tanks and planning your stocking</li>
              <li>Feeding, grading and keeping farm records</li>
              <li>Water quality, filtration and everyday tank management</li>
              <li>Hatchery and fingerling management</li>
            </ul>
            <p>Ask us to confirm the topics, next available dates, duration and fees before booking.</p>
            <a className="button primary" href={training} target="_blank" rel="noreferrer">Request training dates & fees</a>
          </div>
          <aside className="visitPanel">
            <p className="eyebrow blue">VISIT SANDS IN KANYANYA</p>
            <h3>See the farm. Discuss your plans.</h3>
            <p>Find us at Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala.</p>
            <p>Contact us before travelling so we can confirm a suitable time, arrangements and any applicable visit fees.</p>
            <div className="visitActions">
              <a className="button primary" href={visit} target="_blank" rel="noreferrer">Arrange a farm visit</a>
              <a className="serviceLink" href={directions} target="_blank" rel="noreferrer">Find SANDS on Google Maps →</a>
            </div>
          </aside>
        </div>
      </section>

      <section className="section services" aria-labelledby="questions-title">
        <div className="container faqWrap">
          <p className="eyebrow blue">BEFORE YOU ORDER OR VISIT</p>
          <h2 id="questions-title">Common questions</h2>
          <details><summary>How do I order fingerlings?</summary><p>Send the species, quantity, your location and intended stocking date on WhatsApp. We will confirm available sizes, prices, minimum quantities and collection or delivery arrangements before you order.</p></details>
          <details><summary>Can you help me plan a tank system?</summary><p>Tell us your location, available space, water source and intended production scale. Photos and measurements will help us discuss your requirements and the next steps for an assessment or quotation.</p></details>
          <details><summary>Can I visit without booking?</summary><p>Please call or WhatsApp first to confirm visiting arrangements and a suitable time with the farm team.</p></details>
          <details><summary>How much is training?</summary><p>Contact us for current fees, dates and duration. Tell us how many people would attend and the topics you want to cover, so we can confirm an appropriate session.</p></details>
        </div>
      </section>

      <section id="contact" className="section contact">
        <div className="container contactGrid">
          <div className="contactBrand">
            <img src="/sands-logo.jpeg" alt="SANDS logo" />
          </div>
          <div>
            <p className="eyebrow blue">GET IN TOUCH</p>
            <h2>Talk to SANDS</h2>
            <p><strong>Phone:</strong> <a href="tel:+256772402924">+256 772 402924</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/256756188061" target="_blank" rel="noreferrer">+256 756 188061</a></p>
            <p><strong>Email:</strong> <a href="mailto:james@sands.co.ug">james@sands.co.ug</a></p>
            <p><strong>Location:</strong> Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala, Uganda</p>
          </div>
          <div className="contactCta">
            <h3>Ready to talk fish farming?</h3>
            <p>Tell us what you need, your location and your preferred date. Our team will confirm the next steps.</p>
            <a className="button primary"
               href="https://wa.me/256756188061"
               target="_blank" rel="noreferrer">
              Open WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="mobileContact" aria-label="Contact SANDS">
        <a href="tel:+256772402924">Call SANDS</a>
        <a href={whatsapp("Hello SANDS, I found you on sands.co.ug. I would like help with: __.")} target="_blank" rel="noreferrer">WhatsApp enquiry</a>
      </div>
      <footer className="footer">
        <div className="container footerInner">
          <span>© 2026 SANDS FISH FARM (U) LIMITED. All rights reserved.</span>
          <span>Better fish. Smarter farming.</span>
          <a href="/feeding">Private feeding records</a>
        </div>
      </footer>
    </main>
  );
}
