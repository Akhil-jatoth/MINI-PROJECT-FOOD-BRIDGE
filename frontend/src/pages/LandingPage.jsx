import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Global CSS injected once ──────────────────────────────────────── */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #030712; }

  @keyframes fadeSlideUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer      { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes pulse        { 0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,0.4); } 70% { box-shadow:0 0 0 8px rgba(74,222,128,0); } }
  @keyframes glowPulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes float        { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
  @keyframes spin         { to { transform:rotate(360deg); } }
  @keyframes particleDrift {
    0%   { transform:translateY(0) translateX(0) scale(1);   opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:0.6; }
    100% { transform:translateY(-110vh) translateX(var(--drift)) scale(0.5); opacity:0; }
  }

  /* Mobile nav */
  @media (max-width:768px) {
    .nav-desktop { display:none !important; }
    .nav-hamburger { display:flex !important; }
    .footer-inner { flex-direction:column !important; }
  }
  @media (min-width:769px) {
    .nav-hamburger { display:none !important; }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:#030712; }
  ::-webkit-scrollbar-thumb { background:#4ade8055; border-radius:99px; }
  ::-webkit-scrollbar-thumb:hover { background:#4ade80aa; }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById('fb-global-css')) return;
    const el = document.createElement('style');
    el.id = 'fb-global-css';
    el.textContent = globalCSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── Animated Particle Background ──────────────────────────────────── */
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 12,
    delay: Math.random() * 10,
    drift: `${(Math.random() - 0.5) * 120}px`,
    color: ['#4ade8044', '#38bdf844', '#a78bfa44', '#facc1544'][Math.floor(Math.random() * 4)],
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-5%',
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            '--drift': p.drift,
            animation: `particleDrift ${p.duration}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Glow Button – hover glow only on interactive elements ─────────── */
function GlowButton({ children, onClick, style = {}, glowColor = 'rgba(74,222,128,0.5)', disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? `0 0 0 3px ${glowColor}, 0 8px 30px ${glowColor}`
          : style.boxShadow || 'none',
        transform: hovered ? 'translateY(-2px) scale(1.03)' : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Glow Card – subtle glow on hover, no cursor pointer ───────────── */
function GlowCard({ children, style = {}, glowColor = 'rgba(74,222,128,0.3)', onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
        boxShadow: hovered ? `0 0 0 1.5px ${glowColor}, 0 12px 40px ${glowColor}` : style.boxShadow || 'none',
        transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated Counter ──────────────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 2200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── NavLink – hover glow ───────────────────────────────────────────── */
function NavLink({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? 'rgba(74,222,128,0.1)' : 'none',
        border: 'none', cursor: 'pointer',
        color: h ? '#4ade80' : '#9ca3af',
        fontWeight: 500, fontSize: 14, padding: '8px 14px',
        borderRadius: 8, fontFamily: 'inherit',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        textShadow: h ? '0 0 10px rgba(74,222,128,0.5)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Footer helpers ─────────────────────────────────────────────────── */
function FooterSocial({ label, title }) {
  const [h, setH] = useState(false);
  return (
    <a
      href="#contact"
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 38, height: 38, borderRadius: 10,
        background: h ? '#4ade80' : 'rgba(255,255,255,0.06)',
        color: h ? '#000' : '#6b7280',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, textDecoration: 'none',
        transition: 'all 0.25s',
        boxShadow: h ? '0 0 18px rgba(74,222,128,0.55)' : 'none',
        transform: h ? 'translateY(-3px)' : 'none',
        border: '1px solid rgba(74,222,128,0.1)',
      }}
    >
      {label}
    </a>
  );
}

function FooterLink({ label }) {
  const [h, setH] = useState(false);
  return (
    <a
      href="#about"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        color: h ? '#4ade80' : '#6b7280',
        fontSize: 13, textDecoration: 'none', display: 'block',
        transition: 'all 0.2s',
        textShadow: h ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
        paddingLeft: h ? 4 : 0,
      }}
    >
      {label}
    </a>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', height: 1, background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)' }} />
  );
}

/* ──────────────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
──────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  /* ── DATA ── */
  const foodFacts = [
    { icon: '🌾', title: '40% Food Wasted', desc: 'India wastes 67 million tonnes of food annually—enough to feed every hungry person in the country twice over.', color: '#fde68a' },
    { icon: '😔', title: '200M+ Go Hungry', desc: 'Over 200 million Indians sleep hungry every night, while surplus food from events, restaurants, and homes goes to landfills.', color: '#fca5a5' },
    { icon: '🌱', title: 'Environmental Cost', desc: 'Food waste contributes 8% of global greenhouse gas emissions. Diverting food from landfills directly helps fight climate change.', color: '#86efac' },
    { icon: '💰', title: '₹92,000 Cr Lost', desc: 'India loses ₹92,000 crore worth of food annually due to improper storage, distribution failures, and supply-chain inefficiencies.', color: '#93c5fd' },
  ];

  const donationCategories = [
    { icon: '🍱', name: 'Cooked Meals', desc: 'Restaurant leftovers, event surpluses, bulk home-cooked food — any hot food in sealed, labelled containers.', count: '45,000+ meals/month', color: '#4ade80' },
    { icon: '🥫', name: 'Packaged Food', desc: 'Unopened packets, canned goods, dry rations, instant noodles, cereals — anything within its expiry date.', count: '28,000+ packs/month', color: '#38bdf8' },
    { icon: '🥦', name: 'Fresh Produce', desc: 'Surplus vegetables, fruits, and dairy near but before their "best-by" date — collected & delivered within hours.', count: '15,000+ kg/month', color: '#facc15' },
    { icon: '🎂', name: 'Bakery & Sweets', desc: 'Breads, pastries, cakes, mithai from bakeries and sweet shops — donated daily to avoid next-day waste.', count: '8,000+ items/month', color: '#f472b6' },
    { icon: '🌾', name: 'Grains & Pulses', desc: 'Rice, wheat, lentils, and flour in bulk from wholesalers, temples, and community kitchens.', count: '12,000+ kg/month', color: '#a78bfa' },
    { icon: '🍼', name: 'Baby & Child Food', desc: 'Infant formula, baby food pouches, and child-targeted nutrition packs for care homes and hospitals.', count: '3,000+ units/month', color: '#fb923c' },
  ];

  const safetyGuidelines = [
    { icon: '⏰', title: 'Time-Safe Donations', rule: 'Donate within 2 hours of preparation for hot meals, or before the "best by" date for packaged goods. Freshness is non-negotiable.' },
    { icon: '🌡️', title: 'Temperature Control', rule: 'Hot food stays above 60°C and cold food below 4°C during transit. Our volunteers use FSSAI-approved insulated containers.' },
    { icon: '🏷️', title: 'Proper Labeling', rule: 'All donations are labeled with food type, allergens, preparation time, quantity, and dietary info (veg / non-veg / vegan).' },
    { icon: '🧼', title: 'Hygiene Standards', rule: 'Donors must follow basic handwashing and packaging standards. NGOs conduct a rapid quality check before every distribution.' },
    { icon: '⚖️', title: 'FSSAI Compliant', rule: 'Our entire chain — from collection to delivery — follows FSSAI Food Safety and Standards Authority regulations for public food distribution.' },
    { icon: '📋', title: 'Digital Chain of Custody', rule: 'Every donation is logged digitally: who donated, when collected, how stored, and when distributed — full accountability.' },
  ];

  const faqs = [
    { q: 'What types of food can I donate?', a: 'You can donate cooked meals, packaged goods, fresh produce, grains, bakery items, and baby food. Food must be safe, unexpired, and properly packed. We do not accept half-eaten or improperly stored food.' },
    { q: 'How quickly is donated food collected?', a: 'Nearby NGO partners receive instant alerts the moment you post a donation. Collection typically happens within 30–90 minutes for cooked meals and within a few hours for packaged goods.' },
    { q: 'Do I get a tax benefit for food donations?', a: 'Yes! Food donations made through Food Bridge qualify for Section 80G deductions under the Income Tax Act. We issue digitally signed and legally valid receipts within 24 hours.' },
    { q: 'How does Food Bridge verify NGOs?', a: 'Every NGO on our platform goes through admin-level verification including document review, physical address confirmation, and registration number validation before their account is activated.' },
    { q: 'Can I schedule recurring donations?', a: 'Absolutely. Donors (restaurants, hotels, caterers) can set up daily, weekly, or custom recurring donation schedules. We send you reminders 2 hours before each pickup window.' },
    { q: 'Is there a minimum quantity to donate?', a: 'No minimum! Even a single serving counts. However, for logistics efficiency, we batch small donations from nearby donors and deliver them together to the same NGO.' },
  ];

  const impactStories = [
    { metric: '1,200+', label: 'Families Fed Daily', icon: '👨‍👩‍👧‍👦', color: '#4ade80' },
    { metric: '15+', label: 'Cities Covered', icon: '🏙️', color: '#38bdf8' },
    { metric: '2,600 kg', label: 'CO₂ Saved / Week', icon: '🌿', color: '#a78bfa' },
    { metric: '₹18 Cr+', label: 'Food Value Saved', icon: '💚', color: '#facc15' },
  ];

  return (
    <div style={S.root}>
      <InjectStyles />

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{ ...S.navbar, ...(scrolled ? S.navbarScrolled : {}) }}>
        <div style={S.navInner}>
          <div style={S.logo}>
            <span style={S.logoIcon}>🌉</span>
            <span style={S.logoText}>Food<span style={S.logoBrand}>Bridge</span></span>
          </div>

          {/* Desktop links */}
          <div className="nav-desktop" style={S.navLinks}>
            {[
              ['about', 'About'],
              ['how-it-works', 'How It Works'],
              ['impact', 'Impact'],
              ['food-info', 'Food Info'],
              ['faq', 'FAQ'],
              ['contact', 'Contact'],
            ].map(([id, label]) => (
              <NavLink key={id} onClick={() => scrollTo(id)}>{label}</NavLink>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={S.navActions} className="nav-desktop">
            <GlowButton style={S.btnOutline} glowColor="rgba(74,222,128,0.4)" onClick={() => navigate('/login')}>
              Sign In
            </GlowButton>
            <GlowButton style={S.btnPrimary} glowColor="rgba(74,222,128,0.6)" onClick={() => navigate('/register')}>
              Get Started →
            </GlowButton>
          </div>

          {/* Hamburger */}
          <button className="nav-hamburger" style={S.hamburger} onClick={() => setMobileMenuOpen(o => !o)}>
            <span style={{ ...S.bar, ...(mobileMenuOpen ? S.bar1Open : {}) }} />
            <span style={{ ...S.bar, opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ ...S.bar, ...(mobileMenuOpen ? S.bar3Open : {}) }} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={S.mobileMenu}>
            {[['about','About'],['how-it-works','How It Works'],['impact','Impact'],['food-info','Food Info'],['faq','FAQ'],['contact','Contact']].map(([id,label]) => (
              <button key={id} style={S.mobileLink} onClick={() => scrollTo(id)}>{label}</button>
            ))}
            <div style={S.mobileCtas}>
              <GlowButton style={{ ...S.btnOutline, flex: 1 }} glowColor="rgba(74,222,128,0.4)" onClick={() => navigate('/login')}>Sign In</GlowButton>
              <GlowButton style={{ ...S.btnPrimary, flex: 1 }} glowColor="rgba(74,222,128,0.6)" onClick={() => navigate('/register')}>Get Started</GlowButton>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={S.hero}>
        <Particles />
        <div style={S.blob1} />
        <div style={S.blob2} />
        <div style={S.blob3} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 920, animation: 'fadeSlideUp 0.9s ease' }}>
          <div style={S.heroBadge}>
            <span style={S.heroBadgeDot} />
            🇮🇳 India's Trusted Real-Time Food Donation Network
          </div>

          <h1 style={S.heroTitle}>
            Bridging Surplus Food<br />
            <span style={S.heroGradient}>to Those Who Need It Most</span>
          </h1>

          <p style={S.heroSub}>
            Food Bridge connects donors, NGOs, and volunteers in real-time — turning
            <strong style={{ color: '#4ade80' }}> every leftover into a lifeline</strong> and every act
            of generosity into measurable impact across India.
          </p>

          <div style={S.heroCtas}>
            <GlowButton style={S.btnHero} glowColor="rgba(255,255,255,0.4)" onClick={() => navigate('/register')}>
              🍽️ Join as Donor →
            </GlowButton>
            <GlowButton style={S.btnHeroOutline} glowColor="rgba(74,222,128,0.4)" onClick={() => navigate('/register')}>
              🏢 Partner as NGO
            </GlowButton>
            <GlowButton style={S.btnHeroVol} glowColor="rgba(250,204,21,0.4)" onClick={() => navigate('/register')}>
              🚴 Volunteer
            </GlowButton>
          </div>

          <div style={S.trustStrip}>
            {['✅ Verified NGOs', '🔒 FSSAI Compliant', '📍 Location-Based', '⚡ Real-Time Alerts', '🆓 Always Free', '📄 80G Tax Receipts'].map(t => (
              <span key={t} style={S.trustItem}>{t}</span>
            ))}
          </div>
        </div>

        {/* Live Donation Feed */}
        <GlowCard style={S.heroCard} glowColor="rgba(74,222,128,0.3)">
          <div style={S.heroCardHeader}>
            <span style={S.heroCardDot} />
            <span style={{ ...S.heroCardDot, background: '#fbbf24' }} />
            <span style={{ ...S.heroCardDot, background: '#34d399' }} />
            <span style={S.heroCardTitle}>⚡ Live Donation Feed</span>
            <span style={S.liveTag}>LIVE</span>
          </div>
          {[
            { emoji: '🍱', label: 'Tiffin × 30 servings', location: 'Koramangala, Bengaluru', time: '2 min ago', color: '#052e16', dot: '#4ade80' },
            { emoji: '🥘', label: 'Cooked meals × 80', location: 'Andheri, Mumbai', time: '5 min ago', color: '#172554', dot: '#38bdf8' },
            { emoji: '🥐', label: 'Bakery items × 50', location: 'Sector 18, Noida', time: '8 min ago', color: '#1c1917', dot: '#fbbf24' },
            { emoji: '🌾', label: 'Rice 25 kg bag', location: 'T. Nagar, Chennai', time: '14 min ago', color: '#2d1b69', dot: '#a78bfa' },
          ].map((item, i) => (
            <div key={i} style={S.feedRow}>
              <div style={{ ...S.feedEmoji, background: item.color }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={S.feedLabel}>{item.label}</div>
                <div style={S.feedLoc}>📍 {item.location}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...S.feedDot, background: item.dot }} />
                <div style={S.feedTime}>{item.time}</div>
              </div>
            </div>
          ))}
          <div style={S.feedFooter}>🔄 Updates every 60 seconds — <span style={{ color: '#4ade80' }}>join the network</span></div>
        </GlowCard>
      </section>

      <Divider />

      {/* ══════════ MINI IMPACT STRIP ══════════ */}
      <section style={{ background: '#060d1a', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {impactStories.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 180px' }}>
              <div style={{ fontSize: 38, margin: '0 0 6px', filter: `drop-shadow(0 0 8px ${s.color})` }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, textShadow: `0 0 20px ${s.color}66` }}>
                <Counter target={parseInt(s.metric.replace(/\D/g,''))} suffix={s.metric.replace(/[\d,]/g,'').trim()} />
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ STATS ══════════ */}
      <section id="impact" style={S.statsSection}>
        <p style={S.sectionEyebrow}>Our Impact</p>
        <h2 style={S.sectionTitle}>Numbers That Tell the Story</h2>
        <p style={S.factsSub}>Real metrics from our active network — growing every day.</p>
        <div style={S.statsGrid}>
          {[
            { value: 120000, suffix: '+', label: 'Meals Delivered', icon: '🍽️', glow: 'rgba(74,222,128,0.4)' },
            { value: 3400,   suffix: '+', label: 'Donors Registered', icon: '🤝', glow: 'rgba(56,189,248,0.4)' },
            { value: 280,    suffix: '+', label: 'NGO Partners', icon: '🏢', glow: 'rgba(250,204,21,0.4)' },
            { value: 1800,   suffix: '+', label: 'Volunteers Active', icon: '🚴', glow: 'rgba(167,139,250,0.4)' },
          ].map((s, i) => (
            <GlowCard key={i} style={S.statCard} glowColor={s.glow}>
              <div style={S.statIcon}>{s.icon}</div>
              <div style={S.statValue}><Counter target={s.value} suffix={s.suffix} /></div>
              <div style={S.statLabel}>{s.label}</div>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ FOOD FACTS ══════════ */}
      <section id="food-info" style={S.factsSection}>
        <p style={S.sectionEyebrow}>The Problem We Solve</p>
        <h2 style={S.sectionTitle}>India's Food Waste Crisis</h2>
        <p style={S.factsSub}>Understanding the scale of the problem drives our mission forward.</p>
        <div style={S.factsGrid}>
          {foodFacts.map((f, i) => (
            <GlowCard key={i} style={S.factCard} glowColor={`${f.color}55`}>
              <div style={{ ...S.factIconWrap, background: `${f.color}18`, border: `1px solid ${f.color}44` }}>
                <span style={{ fontSize: 32 }}>{f.icon}</span>
              </div>
              <h3 style={{ ...S.factTitle, color: f.color }}>{f.title}</h3>
              <p style={S.factDesc}>{f.desc}</p>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ DONATION CATEGORIES ══════════ */}
      <section style={S.categoriesSection}>
        <p style={S.sectionEyebrow}>What Can Be Donated</p>
        <h2 style={S.sectionTitle}>Types of Food We Accept</h2>
        <p style={{ ...S.factsSub, maxWidth: 640, margin: '0 auto 52px' }}>
          We accept a wide range of food items — from cooked meals to packaged goods — ensuring nothing nutritious goes to waste.
        </p>
        <div style={S.categoriesGrid}>
          {donationCategories.map((cat, i) => (
            <GlowCard key={i} style={S.catCard} glowColor={`${cat.color}44`}>
              <div style={{ ...S.catEmoji, background: `${cat.color}18`, border: `1px solid ${cat.color}44` }}>
                <span style={{ fontSize: 34 }}>{cat.icon}</span>
              </div>
              <h3 style={{ ...S.catName, color: cat.color }}>{cat.name}</h3>
              <p style={S.catDesc}>{cat.desc}</p>
              <div style={{ ...S.catCount, color: cat.color }}>📊 {cat.count}</div>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ ABOUT ══════════ */}
      <section id="about" style={S.aboutSection}>
        <div style={S.aboutGrid}>
          <div style={S.aboutText}>
            <p style={S.sectionEyebrow}>About Food Bridge</p>
            <h2 style={S.sectionTitle}>Why We Exist</h2>
            <p style={S.aboutPara}>
              Every day, <strong style={{ color: '#4ade80' }}>40% of food produced in India</strong> goes to waste
              while <strong style={{ color: '#38bdf8' }}>200 million+</strong> people go to bed hungry.
              Food Bridge was built to close this gap — with technology, verified partnerships, and a growing volunteer network.
            </p>
            <p style={S.aboutPara}>
              Our platform enables hotels, restaurants, catering services, and households to donate surplus food to
              verified NGOs — with real-time logistics powered by volunteer networks across 15+ cities.
            </p>
            <div style={S.aboutPoints}>
              {[
                { icon: '🛡️', text: 'All NGOs are background-verified and admin-approved before activation.', color: '#4ade80' },
                { icon: '📊', text: 'Full transparency — track every donation from pickup to delivery with photo proof.', color: '#38bdf8' },
                { icon: '🌍', text: 'Operating across 15+ cities in India with 1,800+ active community volunteers.', color: '#facc15' },
                { icon: '⚖️', text: 'Legally compliant with FSSAI food safety and distribution regulations.', color: '#f472b6' },
                { icon: '📄', text: '80G-eligible tax receipts issued digitally within 24 hours of donation.', color: '#a78bfa' },
              ].map((p, i) => (
                <div key={i} style={S.aboutPoint}>
                  <span style={{ ...S.aboutPointIcon, filter: `drop-shadow(0 0 6px ${p.color})` }}>{p.icon}</span>
                  <span style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.6 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.aboutVisual}>
            {[
              { title: 'Zero Wastage Goal', body: 'We aim to redirect 100% of surplus food to those in need by 2027 — partnering with every Indian city above 5 lakh population.', icon: '🎯', color: '#4ade80' },
              { title: 'Transparent Chain', body: 'Donors see exactly where food went — down to the last meal — with timestamped photo proof of delivery from volunteers.', icon: '🔍', color: '#38bdf8' },
              { title: '80G Tax Benefits', body: 'All food donations qualify for 80G deduction under the Income Tax Act. Digitally signed, legally valid certificates issued instantly.', icon: '📄', color: '#facc15' },
              { title: 'Real-Time Logistics', body: 'Volunteers get GPS-optimised routes for pickup & delivery, minimising travel time and keeping food fresh from source to plate.', icon: '🚀', color: '#a78bfa' },
            ].map((c, i) => (
              <GlowCard key={i} style={{ ...S.aboutCard, marginTop: i > 0 ? 16 : 0 }} glowColor={`${c.color}33`}>
                <div style={{ ...S.aboutCardIconWrap, color: c.color }}>{c.icon}</div>
                <h3 style={{ ...S.aboutCardTitle, color: c.color }}>{c.title}</h3>
                <p style={S.aboutCardBody}>{c.body}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════ SAFETY GUIDELINES ══════════ */}
      <section style={S.safetySection}>
        <p style={S.sectionEyebrow}>Safety First</p>
        <h2 style={S.sectionTitle}>Food Safety Guidelines</h2>
        <p style={{ ...S.factsSub, maxWidth: 620, margin: '0 auto 52px' }}>
          We take food safety seriously. Every donation follows FSSAI-compliant guidelines to ensure safe, nutritious meals reach every recipient.
        </p>
        <div style={S.safetyGrid}>
          {safetyGuidelines.map((g, i) => (
            <GlowCard key={i} style={S.safetyCard} glowColor="rgba(74,222,128,0.25)">
              <div style={S.safetyIconWrap}>{g.icon}</div>
              <h3 style={S.safetyTitle}>{g.title}</h3>
              <p style={S.safetyRule}>{g.rule}</p>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" style={S.howSection}>
        <p style={S.sectionEyebrow}>Simple Process</p>
        <h2 style={S.sectionTitle}>How Food Bridge Works</h2>
        <p style={{ ...S.factsSub, maxWidth: 560, margin: '0 auto 52px' }}>
          From listing to delivery in minutes — our platform handles every step so you can focus on giving.
        </p>
        <div style={S.howGrid}>
          {[
            { step: '01', icon: '📝', title: 'Register Free',   body: 'Sign up as a Donor, NGO, or Volunteer. Admin verification completes within 24 hours.', color: '#4ade80' },
            { step: '02', icon: '📦', title: 'List Donation',   body: 'Donors add food details — quantity, type, and pickup window — in under 2 minutes.', color: '#38bdf8' },
            { step: '03', icon: '🏢', title: 'NGO Claims',      body: 'Nearby verified NGOs get instant alerts and claim available donations with one click.', color: '#facc15' },
            { step: '04', icon: '🚴', title: 'Volunteer Picks', body: 'Volunteers accept pickup requests and collect food using insulated, GPS-tracked bags.', color: '#f472b6' },
            { step: '05', icon: '📊', title: 'Track Impact',    body: 'Donors receive a photo receipt showing the meals served through their generosity.', color: '#a78bfa' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <GlowCard style={S.howCard} glowColor={`${s.color}44`}>
                <div style={{ ...S.howStep, color: s.color }}>{s.step}</div>
                <div style={{ ...S.howIcon, background: `${s.color}18`, border: `1px solid ${s.color}44` }}>{s.icon}</div>
                <h3 style={{ ...S.howTitle, color: s.color }}>{s.title}</h3>
                <p style={S.howBody}>{s.body}</p>
              </GlowCard>
              {i < 4 && <div style={{ ...S.howArrow, color: s.color }}>→</div>}
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ ROLES ══════════ */}
      <section style={S.rolesSection}>
        <p style={S.sectionEyebrow}>Who Can Join</p>
        <h2 style={S.sectionTitle}>Find Your Role in the Bridge</h2>
        <div style={S.rolesGrid}>
          {[
            {
              icon: '🍽️', title: 'Food Donors', tagline: 'Restaurants • Hotels • Households • Caterers • Temples',
              bullets: [
                'Post surplus food in under 2 minutes',
                'Schedule recurring daily / weekly pickups',
                'Get digital donation receipts instantly',
                'Earn tax-saving 80G certificates',
                'See live impact of your donations',
                'Zero cost, zero liability post-handover',
              ],
              cta: 'Join as Donor', color: '#4ade80', glow: 'rgba(74,222,128,0.35)',
            },
            {
              icon: '🏢', title: 'NGO Partners', tagline: 'Food Banks • Shelters • Schools • Orphanages • Hospitals',
              bullets: [
                'Get instant alerts for nearby donations',
                'Manage pickup scheduling digitally',
                'Track food inventory & distribution',
                'Generate monthly impact reports',
                'Connect with our volunteer network',
                'Access donor relationship tools',
              ],
              cta: 'Register NGO', color: '#38bdf8', glow: 'rgba(56,189,248,0.35)',
            },
            {
              icon: '🚴', title: 'Volunteers', tagline: 'Students • Corporates • Delivery Riders • Individuals',
              bullets: [
                'Accept delivery requests near you',
                'Flexible timing, short 2–5 km routes',
                'Earn community impact badges',
                'Monthly volunteer certificates',
                'Build a social impact portfolio',
                'Insurance coverage during deliveries',
              ],
              cta: 'Volunteer Now', color: '#facc15', glow: 'rgba(250,204,21,0.35)',
            },
          ].map((r, i) => (
            <GlowCard key={i} style={S.roleCard} glowColor={r.glow}>
              <div style={{ ...S.roleIcon, filter: `drop-shadow(0 0 12px ${r.color})` }}>{r.icon}</div>
              <h3 style={{ ...S.roleTitle, color: r.color }}>{r.title}</h3>
              <p style={S.roleTagline}>{r.tagline}</p>
              <ul style={S.roleBullets}>
                {r.bullets.map((b, j) => (
                  <li key={j} style={S.roleBullet}>
                    <span style={{ color: r.color, marginRight: 8, fontWeight: 700 }}>✓</span>{b}
                  </li>
                ))}
              </ul>
              <GlowButton
                style={{ ...S.roleBtn, background: `${r.color}18`, border: `1.5px solid ${r.color}66`, color: r.color }}
                glowColor={r.glow}
                onClick={() => navigate('/register')}
              >
                {r.cta} →
              </GlowButton>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ DONATION TIPS TABS ══════════ */}
      <section style={S.tipsSection}>
        <p style={S.sectionEyebrow}>Maximize Your Impact</p>
        <h2 style={S.sectionTitle}>Donation Tips & Best Practices</h2>
        <div style={S.tabsWrap}>
          {['For Donors', 'For NGOs', 'For Volunteers'].map((tab, i) => (
            <GlowButton
              key={i}
              style={{ ...S.tab, ...(activeTab === i ? S.tabActive : {}) }}
              glowColor="rgba(74,222,128,0.3)"
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </GlowButton>
          ))}
        </div>
        <GlowCard style={S.tipsCard} glowColor="rgba(74,222,128,0.2)">
          {activeTab === 0 && (
            <div style={S.tipsContent}>
              {[
                { icon: '📦', tip: 'Package food in sealed, leak-proof containers with lids before handing over.' },
                { icon: '🏷️', tip: 'Label every package: food type, quantity, allergens, preparation time, and veg/non-veg status.' },
                { icon: '📅', tip: "Schedule recurring donations for consistent weekly surplus — we'll send reminders 2 hours before pickup." },
                { icon: '📸', tip: 'Photograph the food before handover for your own records — useful for audits and receipts.' },
                { icon: '🌡️', tip: 'Keep hot food above 60°C until collection. Use chafing dishes or insulated containers if waiting.' },
                { icon: '📋', tip: 'Food Bridge automatically generates FSSAI-compliant, 80G-eligible tax receipts for every donation.' },
              ].map((t, i) => (
                <div key={i} style={S.tipRow}>
                  <span style={S.tipIcon}>{t.icon}</span>
                  <span style={S.tipText}>{t.tip}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 1 && (
            <div style={S.tipsContent}>
              {[
                { icon: '🔔', tip: 'Enable push notifications to receive instant donation alerts the moment a donor lists food.' },
                { icon: '📊', tip: 'Use the dashboard to track daily intake, distribution routes, and beneficiary headcounts.' },
                { icon: '🤝', tip: 'Build direct relationships with nearby donors for scheduled, predictable daily supply.' },
                { icon: '📋', tip: 'Conduct a rapid quality check on all received donations before distribution to beneficiaries.' },
                { icon: '📍', tip: 'Update your service coverage radius regularly so you only receive alerts for reachable donations.' },
                { icon: '📄', tip: 'Generate monthly impact reports and share with donors — donors who see reports give 3× more.' },
              ].map((t, i) => (
                <div key={i} style={S.tipRow}>
                  <span style={S.tipIcon}>{t.icon}</span>
                  <span style={S.tipText}>{t.tip}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 2 && (
            <div style={S.tipsContent}>
              {[
                { icon: '🚴', tip: 'Accept requests within your comfort range — 2–5 km is the most efficient for freshness.' },
                { icon: '🧊', tip: 'Carry an insulated bag or box to maintain food temperature throughout transit.' },
                { icon: '⏱️', tip: 'Complete pickups within 30 minutes of confirmation to ensure maximum food freshness.' },
                { icon: '📲', tip: 'Keep your availability status up-to-date so NGOs always know when you can accept requests.' },
                { icon: '📸', tip: 'Photograph food at the delivery point — donors and NGOs both receive this as proof of delivery.' },
                { icon: '🏅', tip: 'Log 10+ deliveries to earn your first Community Hero badge and unlock priority requests.' },
              ].map((t, i) => (
                <div key={i} style={S.tipRow}>
                  <span style={S.tipIcon}>{t.icon}</span>
                  <span style={S.tipText}>{t.tip}</span>
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      </section>

      <Divider />

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section style={S.testimonialSection}>
        <p style={S.sectionEyebrow}>Voices of Change</p>
        <h2 style={S.sectionTitle}>What Our Community Says</h2>
        <div style={S.testimonialGrid}>
          {[
            { name: 'Priya Sharma', role: 'Restaurant Owner, Bengaluru', quote: 'We used to throw away 20 kg of food daily. Now every gram goes to someone who needs it. Food Bridge made this completely effortless.', avatar: '👩‍🍳', color: '#4ade80' },
            { name: 'Ramesh Nair', role: 'Director, Hope Foundation NGO', quote: 'The real-time notifications have transformed how we serve our community. We now plan meals 3× better than before — with zero uncertainty.', avatar: '👨‍💼', color: '#38bdf8' },
            { name: 'Anjali Mehta', role: 'Volunteer, Mumbai', quote: 'I spend 2 hours a weekend volunteering and have contributed over 1,000 meals this year. The GPS routing and tracking system is incredible.', avatar: '👩‍🎓', color: '#facc15' },
            { name: 'Chef Arvind Kumar', role: 'Catering Director, New Delhi', quote: 'After every banquet, we used to struggle to dispose of food responsibly. Food Bridge collects within an hour — with full documentation for our CSR reports.', avatar: '👨‍🍳', color: '#f472b6' },
          ].map((t, i) => (
            <GlowCard key={i} style={S.testimonialCard} glowColor={`${t.color}33`}>
              <div style={{ ...S.testimonialQuote, color: t.color }}>"</div>
              <p style={S.testimonialText}>{t.quote}</p>
              <div style={S.testimonialAuthor}>
                <div style={{ ...S.testimonialAvatar, background: `${t.color}18`, border: `1px solid ${t.color}44` }}>{t.avatar}</div>
                <div>
                  <div style={{ ...S.testimonialName, color: t.color }}>{t.name}</div>
                  <div style={S.testimonialRole}>{t.role}</div>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" style={{ ...S.factsSection, background: '#060d1a' }}>
        <p style={S.sectionEyebrow}>Common Questions</p>
        <h2 style={S.sectionTitle}>Frequently Asked Questions</h2>
        <p style={{ ...S.factsSub, maxWidth: 560, margin: '0 auto 52px' }}>
          Everything you need to know before joining the network.
        </p>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <GlowCard
              key={i}
              style={{
                background: 'rgba(10,22,40,0.85)',
                border: faqOpen === i ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, overflow: 'hidden',
              }}
              glowColor="rgba(74,222,128,0.2)"
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 18 }}>{faqOpen === i ? '−' : '+'}</span>
                <span style={{ color: '#f9fafb', fontWeight: 600, fontSize: 15, flex: 1, textAlign: 'left' }}>{faq.q}</span>
              </div>
              {faqOpen === i && (
                <div style={{ padding: '0 24px 20px 24px', color: '#9ca3af', fontSize: 14, lineHeight: 1.8, borderTop: '1px solid rgba(74,222,128,0.12)', paddingTop: 16 }}>
                  {faq.a}
                </div>
              )}
            </GlowCard>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ PARTNERSHIP LOGOS STRIP ══════════ */}
      <section style={{ background: '#030712', padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ ...S.sectionEyebrow, marginBottom: 32 }}>Trusted By</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {['🏛️ FSSAI Certified', '🇮🇳 Startup India', '🌍 UN SDG Partner', '🏅 NASSCOM Member', '💚 GiveIndia Listed', '⚖️ 80G Registered'].map(p => (
            <div key={p} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,222,128,0.12)',
              borderRadius: 12, padding: '14px 22px', color: '#9ca3af', fontSize: 13, fontWeight: 600,
            }}>
              {p}
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ CTA ══════════ */}
      <section style={S.ctaSection}>
        <GlowCard style={S.ctaBox} glowColor="rgba(74,222,128,0.4)">
          <div style={S.ctaBlob1} />
          <div style={S.ctaBlob2} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={S.ctaIconBig}>🌉</div>
            <p style={S.ctaEyebrow}>Make a Difference Today</p>
            <h2 style={S.ctaTitle}>Every Meal Counts. Start Giving.</h2>
            <p style={S.ctaSub}>
              Join 3,400+ donors and 280+ NGOs already using Food Bridge to fight hunger across India.
              Your surplus food can be someone's survival — one meal at a time.
            </p>
            <div style={S.ctaBtns}>
              <GlowButton style={S.btnHeroWhite} glowColor="rgba(255,255,255,0.6)" onClick={() => navigate('/register')}>
                🚀 Create Free Account
              </GlowButton>
              <GlowButton style={S.btnHeroGhost} glowColor="rgba(74,222,128,0.4)" onClick={() => navigate('/login')}>
                Sign In →
              </GlowButton>
            </div>
          </div>
        </GlowCard>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="contact" style={S.footer}>
        <div className="footer-inner" style={S.footerInner}>
          <div style={S.footerBrand}>
            <div style={S.logo}>
              <span style={S.logoIcon}>🌉</span>
              <span style={{ ...S.logoText, color: '#fff' }}>Food<span style={{ color: '#4ade80' }}>Bridge</span></span>
            </div>
            <p style={S.footerTagline}>Connecting compassion with hunger, one meal at a time.</p>
            <p style={{ ...S.footerTagline, marginTop: 8 }}>Registered under FSSAI • 80G Certified • Startup India</p>
            <div style={S.socialRow}>
              {[{ label: '𝕏', title: 'Twitter' }, { label: 'in', title: 'LinkedIn' }, { label: '📸', title: 'Instagram' }, { label: 'f', title: 'Facebook' }].map(s => (
                <FooterSocial key={s.title} label={s.label} title={s.title} />
              ))}
            </div>
          </div>

          <div style={S.footerLinks}>
            {[
              { title: 'Platform', links: ['How It Works', 'For Donors', 'For NGOs', 'For Volunteers', 'Food Safety', 'Impact Report'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Press', 'Careers', 'FSSAI Compliance', 'CSR Partnership'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Grievance'] },
            ].map(col => (
              <div key={col.title} style={S.footerCol}>
                <h4 style={S.footerColTitle}>{col.title}</h4>
                {col.links.map(l => <FooterLink key={l} label={l} />)}
              </div>
            ))}
          </div>
        </div>

        <div style={S.footerBottom}>
          <span>© 2026 Food Bridge. All rights reserved. Made with ❤️ to fight hunger in India.</span>
          <span style={{ color: '#4ade80' }}>🇮🇳 Proudly Serving India</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */
const S = {
  root: {
    fontFamily: "'Inter','Segoe UI',sans-serif",
    background: '#030712',
    color: '#f9fafb',
    overflowX: 'hidden',
  },

  /* ── Navbar ── */
  navbar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: 'rgba(3,7,18,0.6)',
    backdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(74,222,128,0.08)',
    transition: 'all 0.35s ease',
  },
  navbarScrolled: {
    background: 'rgba(3,7,18,0.95)',
    borderBottom: '1px solid rgba(74,222,128,0.2)',
    boxShadow: '0 4px 40px rgba(0,0,0,0.6)',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, textDecoration: 'none' },
  logoIcon: { fontSize: 26 },
  logoText: { fontSize: 20, fontWeight: 800, color: '#f9fafb' },
  logoBrand: { color: '#4ade80', textShadow: '0 0 14px rgba(74,222,128,0.5)' },
  navLinks: { display: 'flex', gap: 2, alignItems: 'center' },
  navActions: { display: 'flex', gap: 10, alignItems: 'center' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 },
  bar: { width: 24, height: 2, background: '#d1d5db', borderRadius: 2, transition: 'all 0.3s', display: 'block' },
  bar1Open: { transform: 'translateY(7px) rotate(45deg)' },
  bar3Open: { transform: 'translateY(-7px) rotate(-45deg)' },
  mobileMenu: {
    padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4,
    background: 'rgba(3,7,18,0.98)', borderTop: '1px solid rgba(74,222,128,0.12)',
  },
  mobileLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    textAlign: 'left', color: '#d1d5db', fontWeight: 500, fontSize: 16, padding: '12px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'inherit',
  },
  mobileCtas: { display: 'flex', gap: 12, paddingTop: 16 },

  /* ── Buttons ── */
  btnPrimary: {
    background: 'linear-gradient(135deg,#16a34a,#15803d)',
    color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
    padding: '10px 22px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
  },
  btnOutline: {
    background: 'transparent',
    color: '#4ade80', border: '1.5px solid rgba(74,222,128,0.7)', fontWeight: 700, fontSize: 14,
    padding: '9px 22px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnHero: {
    background: '#fff', color: '#15803d',
    border: 'none', fontWeight: 800, fontSize: 16,
    padding: '16px 36px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnHeroOutline: {
    background: 'rgba(74,222,128,0.08)', color: '#4ade80',
    border: '2px solid rgba(74,222,128,0.45)', fontWeight: 700, fontSize: 16,
    padding: '14px 36px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnHeroVol: {
    background: 'rgba(250,204,21,0.08)', color: '#facc15',
    border: '2px solid rgba(250,204,21,0.4)', fontWeight: 700, fontSize: 16,
    padding: '14px 36px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnHeroWhite: {
    background: '#fff', color: '#15803d',
    border: 'none', fontWeight: 800, fontSize: 16,
    padding: '16px 36px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnHeroGhost: {
    background: 'rgba(74,222,128,0.1)', color: '#4ade80',
    border: '2px solid rgba(74,222,128,0.4)', fontWeight: 700, fontSize: 16,
    padding: '14px 36px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
  },

  /* ── Hero ── */
  hero: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #030712 0%, #0a1628 30%, #051a10 60%, #030f1c 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '130px 24px 80px', textAlign: 'center',
    position: 'relative', overflow: 'hidden',
  },
  blob1: { position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(74,222,128,0.12),transparent)', top:-200, left:-250, pointerEvents:'none' },
  blob2: { position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.1),transparent)', bottom:-150, right:-200, pointerEvents:'none' },
  blob3: { position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(250,204,21,0.08),transparent)', top:'40%', right:'8%', pointerEvents:'none' },

  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(74,222,128,0.07)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(74,222,128,0.22)',
    color: '#86efac', fontSize: 13, fontWeight: 600,
    padding: '8px 20px', borderRadius: 99, marginBottom: 28,
  },
  heroBadgeDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)',
    animation: 'pulse 2s infinite', display: 'inline-block',
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem,5vw,4.2rem)',
    fontWeight: 900, color: '#fff', margin: '0 0 22px',
    lineHeight: 1.1, letterSpacing: '-0.025em',
  },
  heroGradient: {
    background: 'linear-gradient(90deg, #4ade80, #38bdf8, #a78bfa, #4ade80)',
    backgroundSize: '300% auto',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    animation: 'shimmer 4s linear infinite',
  },
  heroSub: {
    color: '#9ca3af', fontSize: 'clamp(1rem,2vw,1.2rem)',
    maxWidth: 640, lineHeight: 1.85, margin: '0 auto 36px',
  },
  heroCtas: { display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
  trustStrip: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 36 },
  trustItem: {
    background: 'rgba(74,222,128,0.06)', color: '#86efac',
    fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 99,
    border: '1px solid rgba(74,222,128,0.18)',
  },

  /* ── Live Card ── */
  heroCard: {
    marginTop: 56, background: 'rgba(6,13,26,0.95)',
    borderRadius: 20, padding: '20px 24px',
    width: '100%', maxWidth: 500,
    border: '1px solid rgba(74,222,128,0.15)',
    backdropFilter: 'blur(24px)',
    position: 'relative', zIndex: 2,
  },
  heroCardHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 },
  heroCardDot: { width: 12, height: 12, borderRadius: '50%', background: '#ef4444' },
  heroCardTitle: { marginLeft: 8, color: '#9ca3af', fontWeight: 700, fontSize: 13 },
  liveTag: {
    marginLeft: 'auto', background: 'rgba(239,68,68,0.18)', color: '#f87171',
    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
    border: '1px solid rgba(239,68,68,0.3)', letterSpacing: '0.1em',
    animation: 'glowPulse 2s infinite',
  },
  feedRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  feedEmoji: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  feedLabel: { fontSize: 13, fontWeight: 700, color: '#f9fafb' },
  feedLoc: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  feedDot: { width: 6, height: 6, borderRadius: '50%', marginLeft: 'auto', marginBottom: 4 },
  feedTime: { fontSize: 11, color: '#374151', whiteSpace: 'nowrap' },
  feedFooter: { fontSize: 11, color: '#374151', textAlign: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' },

  /* ── Stats ── */
  statsSection: { padding: '100px 24px', background: '#060d1a', textAlign: 'center' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
    gap: 24, maxWidth: 1000, margin: '48px auto 0',
  },
  statCard: {
    background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(5,46,22,0.4))',
    border: '1px solid rgba(74,222,128,0.12)',
    borderRadius: 20, padding: '36px 24px', textAlign: 'center',
  },
  statIcon: { fontSize: 42, marginBottom: 12 },
  statValue: { fontSize: 44, fontWeight: 900, color: '#4ade80', lineHeight: 1, textShadow: '0 0 24px rgba(74,222,128,0.4)' },
  statLabel: { fontSize: 14, color: '#9ca3af', fontWeight: 600, marginTop: 8 },

  /* ── Facts ── */
  factsSection: { padding: '100px 24px', background: '#030712', textAlign: 'center' },
  factsSub: { color: '#6b7280', fontSize: 16, lineHeight: 1.75, marginBottom: 52 },
  factsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
    gap: 24, maxWidth: 1100, margin: '48px auto 0',
  },
  factCard: {
    background: 'rgba(10,22,40,0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20, padding: '32px 24px', textAlign: 'left',
  },
  factIconWrap: {
    width: 68, height: 68, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  factTitle: { fontSize: 18, fontWeight: 800, margin: '0 0 12px' },
  factDesc: { fontSize: 14, color: '#6b7280', lineHeight: 1.8 },

  /* ── Categories ── */
  categoriesSection: { padding: '100px 24px', background: '#060d1a', textAlign: 'center' },
  categoriesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
    gap: 20, maxWidth: 1100, margin: '8px auto 0',
  },
  catCard: {
    background: 'rgba(10,22,40,0.85)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 18, padding: '28px 22px', textAlign: 'left',
  },
  catEmoji: { width: 66, height: 66, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  catName: { fontSize: 17, fontWeight: 800, margin: '0 0 8px' },
  catDesc: { fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 14 },
  catCount: { fontSize: 12, fontWeight: 700 },

  /* ── About ── */
  aboutSection: { padding: '100px 24px', background: '#030712' },
  aboutGrid: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
    gap: 64, alignItems: 'start',
  },
  aboutText: {},
  aboutPara: { color: '#9ca3af', fontSize: 15, lineHeight: 1.9, marginBottom: 16 },
  aboutPoints: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  aboutPoint: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    background: 'rgba(255,255,255,0.02)', borderRadius: 12,
    padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)',
  },
  aboutPointIcon: { fontSize: 22, flexShrink: 0 },
  aboutVisual: { display: 'flex', flexDirection: 'column', gap: 0 },
  aboutCard: {
    background: 'rgba(10,22,40,0.88)',
    border: '1px solid rgba(74,222,128,0.1)',
    borderRadius: 18, padding: '26px',
  },
  aboutCardIconWrap: { fontSize: 34, marginBottom: 12 },
  aboutCardTitle: { fontSize: 17, fontWeight: 800, margin: '0 0 8px' },
  aboutCardBody: { fontSize: 13, color: '#6b7280', lineHeight: 1.8, margin: 0 },

  /* ── Safety ── */
  safetySection: { padding: '100px 24px', background: '#060d1a', textAlign: 'center' },
  safetyGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
    gap: 24, maxWidth: 1100, margin: '0 auto',
  },
  safetyCard: {
    background: 'rgba(10,22,40,0.8)',
    border: '1px solid rgba(74,222,128,0.1)',
    borderRadius: 20, padding: '32px 26px', textAlign: 'left',
  },
  safetyIconWrap: { fontSize: 38, marginBottom: 18 },
  safetyTitle: { fontSize: 17, fontWeight: 800, color: '#4ade80', margin: '0 0 12px' },
  safetyRule: { fontSize: 14, color: '#6b7280', lineHeight: 1.8 },

  /* ── Shared typography ── */
  sectionEyebrow: {
    textTransform: 'uppercase', letterSpacing: '0.15em',
    fontSize: 12, fontWeight: 700, color: '#4ade80',
    marginBottom: 12, textShadow: '0 0 12px rgba(74,222,128,0.4)',
  },
  sectionTitle: {
    fontSize: 'clamp(1.6rem,3.5vw,2.6rem)',
    fontWeight: 900, color: '#f9fafb', marginBottom: 16, lineHeight: 1.15,
  },

  /* ── How it works ── */
  howSection: { padding: '100px 24px', background: '#030712', textAlign: 'center' },
  howGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 0,
    maxWidth: 1100, margin: '52px auto 0', justifyContent: 'center',
  },
  howCard: {
    flex: '1 1 180px', maxWidth: 210,
    padding: '28px 16px', position: 'relative', textAlign: 'center',
    background: 'rgba(10,22,40,0.75)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 18, margin: 8,
  },
  howStep: { fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase' },
  howIcon: { width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' },
  howTitle: { fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 8px' },
  howBody: { fontSize: 12, color: '#6b7280', lineHeight: 1.8 },
  howArrow: { position: 'absolute', right: -22, top: '40%', fontSize: 24, fontWeight: 900, opacity: 0.5 },

  /* ── Roles ── */
  rolesSection: { padding: '100px 24px', background: '#060d1a', textAlign: 'center' },
  rolesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
    gap: 28, maxWidth: 1100, margin: '52px auto 0',
  },
  roleCard: {
    background: 'rgba(10,22,40,0.88)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24, padding: '36px 28px', textAlign: 'left',
  },
  roleIcon: { fontSize: 46, marginBottom: 16 },
  roleTitle: { fontSize: 22, fontWeight: 900, margin: '0 0 4px' },
  roleTagline: { fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 22 },
  roleBullets: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 },
  roleBullet: { fontSize: 13, color: '#9ca3af', fontWeight: 500 },
  roleBtn: { fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 12, cursor: 'pointer', width: '100%', fontFamily: 'inherit' },

  /* ── Tips / Tabs ── */
  tipsSection: { padding: '100px 24px', background: '#030712', textAlign: 'center' },
  tabsWrap: { display: 'flex', gap: 12, justifyContent: 'center', margin: '36px 0 28px', flexWrap: 'wrap' },
  tab: {
    background: 'rgba(255,255,255,0.04)', color: '#6b7280',
    border: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 600, fontSize: 14, padding: '10px 28px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: {
    background: 'rgba(74,222,128,0.12)', color: '#4ade80',
    border: '1px solid rgba(74,222,128,0.35)',
    textShadow: '0 0 10px rgba(74,222,128,0.4)',
  },
  tipsCard: {
    maxWidth: 860, margin: '0 auto',
    background: 'rgba(10,22,40,0.88)',
    border: '1px solid rgba(74,222,128,0.12)',
    borderRadius: 22, padding: '40px',
  },
  tipsContent: { display: 'flex', flexDirection: 'column', gap: 18 },
  tipRow: { display: 'flex', alignItems: 'flex-start', gap: 16, textAlign: 'left' },
  tipIcon: { fontSize: 26, flexShrink: 0 },
  tipText: { fontSize: 15, color: '#9ca3af', lineHeight: 1.75, paddingTop: 2 },

  /* ── Testimonials ── */
  testimonialSection: { padding: '100px 24px', background: '#060d1a', textAlign: 'center' },
  testimonialGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
    gap: 24, maxWidth: 1200, margin: '52px auto 0',
  },
  testimonialCard: {
    background: 'rgba(10,22,40,0.88)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20, padding: '32px 28px', textAlign: 'left',
  },
  testimonialQuote: { fontSize: 64, fontWeight: 900, lineHeight: 0.8, marginBottom: 16 },
  testimonialText: { fontSize: 14, color: '#9ca3af', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' },
  testimonialAuthor: { display: 'flex', alignItems: 'center', gap: 14 },
  testimonialAvatar: { fontSize: 28, width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  testimonialName: { fontSize: 14, fontWeight: 800 },
  testimonialRole: { fontSize: 11, color: '#4b5563', marginTop: 2 },

  /* ── CTA ── */
  ctaSection: { padding: '100px 24px', background: '#030712' },
  ctaBox: {
    maxWidth: 820, margin: '0 auto',
    background: 'linear-gradient(135deg, rgba(5,46,22,0.9), rgba(10,22,40,0.9), rgba(4,47,46,0.88))',
    borderRadius: 28, padding: '80px 48px',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
    border: '1px solid rgba(74,222,128,0.2)',
  },
  ctaBlob1: { position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(74,222,128,0.12),transparent)', top:-100, left:-100, pointerEvents:'none' },
  ctaBlob2: { position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.1),transparent)', bottom:-80, right:-80, pointerEvents:'none' },
  ctaIconBig: { fontSize: 58, marginBottom: 16, filter: 'drop-shadow(0 0 22px rgba(74,222,128,0.5))', animation: 'float 3s ease-in-out infinite' },
  ctaEyebrow: { color: '#86efac', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 },
  ctaTitle: { fontSize: 'clamp(1.6rem,4vw,2.7rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 18 },
  ctaSub: { color: '#9ca3af', fontSize: 15, lineHeight: 1.85, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' },
  ctaBtns: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },

  /* ── Footer ── */
  footer: { background: '#010409', padding: '72px 24px 24px' },
  footerInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'flex', flexWrap: 'wrap', gap: 48, paddingBottom: 56,
    borderBottom: '1px solid rgba(74,222,128,0.07)',
  },
  footerBrand: { flex: '1 1 240px', maxWidth: 300 },
  footerTagline: { color: '#374151', fontSize: 13, lineHeight: 1.7, margin: '14px 0 0' },
  socialRow: { display: 'flex', gap: 10, marginTop: 22 },
  footerLinks: { flex: '1 1 400px', display: 'flex', flexWrap: 'wrap', gap: 40 },
  footerCol: { flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 10 },
  footerColTitle: { color: '#4ade80', fontWeight: 700, fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' },
  footerBottom: {
    maxWidth: 1100, margin: '24px auto 0',
    display: 'flex', flexWrap: 'wrap', gap: 16,
    justifyContent: 'space-between', color: '#374151', fontSize: 12,
  },
};