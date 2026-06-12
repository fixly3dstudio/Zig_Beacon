/* ZIG BEACON — script.js */

/* ---- Scroll animation observer ---- */
const animateEls = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
animateEls.forEach(el => observer.observe(el));

/* Hero visible immediately */
document.querySelectorAll('.hero [data-animate]').forEach(el => {
  setTimeout(() => el.classList.add('visible'), 200);
});

/* ---- Nav scroll state ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- Position radar signals using JS trig (CSS cos/sin not widely supported) ---- */
function positionSignals() {
  const signals = document.querySelectorAll('.signal');
  signals.forEach(sig => {
    const style = sig.getAttribute('style') || '';
    const angleMatch = style.match(/--angle:([\d.]+)deg/);
    const distMatch  = style.match(/--dist:([\d.]+)%/);
    if (!angleMatch || !distMatch) return;
    const angleDeg = parseFloat(angleMatch[1]);
    const dist     = parseFloat(distMatch[1]) / 100;
    const rad      = angleDeg * Math.PI / 180;
    const radius   = 220;
    const x = Math.cos(rad) * dist * radius;
    const y = Math.sin(rad) * dist * radius;
    sig.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });
}
positionSignals();

/* ---- AI Coach interactive terminal ---- */
const responses = {
  default: {
    tag: 'Analysing 18 sources · 3,421 signals',
    html: `
      <p>Top complaint clusters this month:</p>
      <ol>
        <li><strong>Promotions not applied automatically</strong> — 847 mentions (↑34%)</li>
        <li><strong>Ride selection UI unclear</strong> — 612 mentions</li>
        <li><strong>Long ETA at airport terminal</strong> — 489 mentions</li>
        <li><strong>Payment flow extra steps</strong> — 331 mentions (↑18%)</li>
      </ol>
      <p class="term-insight">💡 <em>Promotions and Airport combined account for 40% of all complaints. High opportunity for UX intervention.</em></p>
    `,
    sources: 'Sources: App Store · Play Store · Reddit SG · Support tickets'
  },
  'grab': {
    tag: 'Scanning Grab SG competitor profile',
    html: `
      <p>Grab's airport pickup flow (as of latest v6.2 update):</p>
      <ol>
        <li><strong>Pre-book 30 min before arrival</strong> — with live flight tracking integration</li>
        <li><strong>Dedicated pickup zones</strong> — T1/T2/T3 with colour-coded driver meeting point</li>
        <li><strong>Driver photo + plate shown 5 min before landing</strong></li>
        <li><strong>Auto-rebooking</strong> if flight delayed by 20+ minutes</li>
      </ol>
      <p class="term-insight">💡 <em>Zig currently lacks flight tracking and auto-rebooking. These are high-impact features rated 94/100 opportunity score.</em></p>
    `,
    sources: 'Sources: Competitor screenshots · App Store changelog · Design Research Library'
  },
  'loyalty': {
    tag: 'Scanning loyalty programs across 12 competitors',
    html: `
      <p>Best-in-class loyalty programs ranked:</p>
      <ol>
        <li><strong>Grab Rewards</strong> — Points + tier system, 8M+ active members, partner redemptions</li>
        <li><strong>Uber One</strong> — Subscription-based, $10/month, unlimited discounts + Uber Eats</li>
        <li><strong>Gojek GoRewards</strong> — Ecosystem points (rides, food, payments)</li>
      </ol>
      <p class="term-insight">💡 <em>Zig Rewards currently score 71/100. Key gap: no partner redemption and no tiered status. Opportunity: subscription model (high ROI based on Uber One data).</em></p>
    `,
    sources: 'Sources: Global competitor analysis · Feature Gap Radar · Beacon Score'
  },
  'improve': {
    tag: 'Running AI prioritisation engine',
    html: `
      <p>Top 4 recommended improvements for Q3 based on evidence:</p>
      <ol>
        <li><strong>Promo auto-apply</strong> — 847 complaints, Beacon 48, effort: Medium → <em>ship next sprint</em></li>
        <li><strong>Airport pickup redesign</strong> — 489 complaints, revenue impact: S$180K/mo</li>
        <li><strong>Ride selection card clarity</strong> — 612 complaints, 3.2% booking drop-off</li>
        <li><strong>Rewards tier system</strong> — gap vs Grab, high retention impact</li>
      </ol>
      <p class="term-insight">💡 <em>Items 1–3 alone could recover an estimated S$340K/month in lost bookings based on industry conversion benchmarks.</em></p>
    `,
    sources: 'Sources: Customer Signals · Beacon Score · UX Opportunity Hub · Revenue Analytics'
  },
  'innovation': {
    tag: 'Scanning global mobility innovation feed',
    html: `
      <p>Top mobility innovations this month:</p>
      <ol>
        <li><strong>Uber AI preference learning</strong> — predicts your ride type before you open the app</li>
        <li><strong>Bolt EV fleet expansion</strong> — 40% of London rides now electric</li>
        <li><strong>Waymo robotaxi expansion</strong> — Austin + Atlanta added, SAE L4 fully autonomous</li>
        <li><strong>Grab SuperApp 3.0</strong> — unified finance, food, ride booking in single flow</li>
      </ol>
      <p class="term-insight">💡 <em>AI personalisation and EV integration are the two dominant themes this month. Watch Uber's preference learning for potential Zig adaptation.</em></p>
    `,
    sources: 'Sources: Innovation Watch feed · News APIs · TechCrunch · Bloomberg'
  }
};

function getResponseKey(query) {
  const q = query.toLowerCase();
  if (q.includes('complain') || q.includes('users')) return 'default';
  if (q.includes('grab') || q.includes('airport')) return 'grab';
  if (q.includes('loyalty') || q.includes('family') || q.includes('best')) return 'loyalty';
  if (q.includes('improve') || q.includes('next') || q.includes('should')) return 'improve';
  if (q.includes('innovation') || q.includes('trend') || q.includes('month')) return 'innovation';
  return 'default';
}

function typeText(el, text, speed = 18) {
  el.textContent = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  el.appendChild(cursor);
  const interval = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
    } else {
      clearInterval(interval);
      cursor.remove();
    }
  }, speed);
}

function sendQuery() {
  const input = document.getElementById('coach-input');
  const query = input.value.trim() || 'What are users complaining about most?';
  input.value = '';

  const queryEl    = document.getElementById('term-query-text');
  const responseEl = document.getElementById('term-response');
  const body       = document.getElementById('terminal-body');

  const key  = getResponseKey(query);
  const resp = responses[key];

  typeText(queryEl, query, 20);
  responseEl.style.opacity = '0';

  setTimeout(() => {
    responseEl.querySelector('.term-tag').textContent = resp.tag;
    responseEl.querySelector('.term-answer').innerHTML = resp.html;
    responseEl.querySelector('.term-sources').textContent = resp.sources;
    responseEl.style.transition = 'opacity 0.5s';
    responseEl.style.opacity = '1';
    body.scrollTop = body.scrollHeight;
  }, 600);
}

function selectQuery(el) {
  const text = el.textContent.replace('↗ ', '').trim();
  document.getElementById('coach-input').value = text;
  sendQuery();
  document.getElementById('coach-input').focus();
}

document.getElementById('coach-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendQuery();
});

/* ---- Competitor card click ---- */
document.querySelectorAll('.preview-competitor').forEach(card => {
  card.addEventListener('click', () => {
    const grid = card.closest('.preview-competitor-grid') || card.closest('.module-preview-grid');
    if (grid) grid.querySelectorAll('.preview-competitor').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

/* ---- Animate score bars on scroll ---- */
const scoreBand = document.querySelector('.score-band');
if (scoreBand) {
  const scoreObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.score-bar').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
          bar.style.width = bar.style.getPropertyValue('--w') || bar.style.cssText.match(/--w:([\d.%]+)/)?.[1] || '80%';
        }, i * 80);
      });
      scoreObs.disconnect();
    }
  }, { threshold: 0.4 });
  scoreObs.observe(scoreBand);
}
