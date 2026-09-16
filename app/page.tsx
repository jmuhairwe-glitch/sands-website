const services = [
  { icon: "🐟", title: "Catfish & Tilapia Hatchery", text: "Quality fingerlings for profitable farming." },
  { icon: "📈", title: "Grow-out & Intensive Fish Production", text: "Efficient production systems designed for higher yields." },
  { icon: "💧", title: "RAS / Tank Systems", text: "Modern, water-efficient aquaculture solutions." },
  { icon: "🌾", title: "Fish Feed Development", text: "Practical, nutritious and cost-conscious feeding solutions." },
  { icon: "👥", title: "Training & Farmer Support", text: "Hands-on knowledge and practical aquaculture skills." },
  { icon: "♻️", title: "Circular Fish Farming", text: "Turning fish-farm wastewater into useful agricultural inputs." },
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <div className="container navWrap">
          <a className="brand" href="#home" aria-label="SANDS Fish Farm home">
            <img src="/sands-logo.jpeg" alt="SANDS beyond the horizon logo" />
          </a>
          <nav className="nav">
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
            Practical Aquaculture.<br />
            Better Fish.<br />
            <span>Smarter Farming.</span>
          </h1>
          <p className="heroText">
            Quality fish, sustainable systems and practical solutions for a healthier tomorrow.
          </p>
          <div className="heroActions">
            <a className="button primary" href="#services">Our Services →</a>
            <a className="button outline"
               href="https://wa.me/256756188061"
               target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="section services">
        <div className="container">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow blue">OUR SERVICES</p>
              <h2>Practical solutions for modern aquaculture</h2>
            </div>
          </div>
          <div className="serviceGrid">
            {services.map((service) => (
              <article className="serviceCard" key={service.title}>
                <div className="serviceIcon" aria-hidden="true">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
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

      <section id="training" className="impact">
        <div className="container impactGrid">
          <div><span>🐟</span><strong>Healthy Fish</strong><small>Better nutrition for families</small></div>
          <div><span>🌿</span><strong>Sustainable Systems</strong><small>Efficient use of water and resources</small></div>
          <div><span>👥</span><strong>Stronger Communities</strong><small>Knowledge, skills and opportunity</small></div>
          <div><span>🌍</span><strong>A Greener Tomorrow</strong><small>Turning challenges into value</small></div>
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
            <p><strong>Phone:</strong> +256 772 402924</p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/256756188061" target="_blank" rel="noreferrer">+256 756 188061</a></p>
            <p><strong>Email:</strong> <a href="mailto:james@sands.co.ug">james@sands.co.ug</a></p>
            <p><strong>Location:</strong> Kampala, Uganda</p>
          </div>
          <div className="contactCta">
            <h3>Ready to talk fish farming?</h3>
            <p>Message us directly on WhatsApp for a quick response.</p>
            <a className="button primary"
               href="https://wa.me/256756188061"
               target="_blank" rel="noreferrer">
              Open WhatsApp
            </a>
          </div>
        </div>
      </section>

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
