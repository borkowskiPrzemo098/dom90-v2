// DOM90 v2 — interakcje strony (bez zależności)
document.documentElement.classList.add('js');

// Intl pl-PL nie grupuje liczb 4-cyfrowych („3800”), a w treści strony piszemy „3 800”
const PLN = { format: (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') };
const zl = (n) => `${PLN.format(n)} zł`;

document.addEventListener('DOMContentLoaded', () => {
  // Nagłówek: cień po przewinięciu, pasek akcji chowa się przy stopce
  const header = document.querySelector('[data-header]');
  const bar = document.querySelector('.action-bar');
  const footer = document.querySelector('.site-footer');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  if (bar && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => bar.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.05 }).observe(footer);
  }

  // Menu mobilne
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu?.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Przełącznik metrażu przy standardach
  document.querySelectorAll('[data-metraz]').forEach((group) => {
    const scope = group.closest('section');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-m]');
      if (!btn) return;
      const m = Number(btn.dataset.m);
      group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      scope.querySelectorAll('[data-rate]').forEach((box) => {
        box.classList.add('is-updating');
        setTimeout(() => {
          box.querySelector('[data-area]').textContent = m;
          box.querySelector('[data-total]').textContent = zl(m * Number(box.dataset.rate));
          box.classList.remove('is-updating');
        }, 160);
      });
    });
  });

  // Zakładki (rzuty, warianty ściany)
  document.querySelectorAll('[data-tabs]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
      if (next) { e.preventDefault(); next.focus(); select(next); }
    });
  });

  initConfigurator();
});

function initConfigurator() {
  const form = document.querySelector('[data-config]');
  if (!form) return;
  const RATES = { klucz: 4300, aranzacja: 3800 };
  const NAMES = { klucz: 'Pod klucz', aranzacja: 'Do własnej aranżacji' };
  const ADDONS = { plyta: { name: 'Płyta fundamentowa', price: 12000, note: 'do 12 000 zł' } };
  const area = form.querySelector('#area');
  const areaOut = form.querySelector('#area-out');
  const priceEl = document.querySelector('[data-price]');
  const summaryEl = document.querySelector('[data-summary]');
  const linesEl = document.querySelector('[data-lines]');
  const status = form.querySelector('[data-status]');

  // Metraż z linku, np. cennik.html?m=70#konfigurator
  const fromUrl = Number(new URLSearchParams(location.search).get('m'));
  if (fromUrl >= 20 && fromUrl <= 300) area.value = fromUrl;

  const state = () => {
    const fd = new FormData(form);
    const m = Number(fd.get('area'));
    const std = fd.get('standard');
    const beds = fd.get('bedrooms');
    const km = Math.max(0, Number(fd.get('distance') || 0));
    const plyta = fd.get('plyta') === 'tak';
    const base = m * RATES[std];
    const transport = km > 150 ? (km - 150) * 10 : 0;
    const total = base + transport + (plyta ? ADDONS.plyta.price : 0);
    return { m, std, beds, km, plyta, base, transport, total };
  };

  // Trzy sypialnie dopiero od 70 m² (zgodnie z FAQ)
  const syncBeds = (m) => {
    const three = form.querySelector('input[name="bedrooms"][value="3"]');
    three.disabled = m < 70;
    if (three.disabled && three.checked) form.querySelector('input[name="bedrooms"][value="2"]').checked = true;
  };

  const render = () => {
    const s = state();
    areaOut.value = `${s.m} m²`;
    syncBeds(s.m);
    priceEl.textContent = zl(s.total);
    summaryEl.textContent = `${s.m} m² · ${NAMES[s.std]} · ${s.beds} ${s.beds === '1' ? 'sypialnia' : 'sypialnie'}`;
    const lines = [[`${s.m} m² × ${PLN.format(RATES[s.std])} zł`, zl(s.base)]];
    lines.push(['Transport i montaż', s.transport ? `+ ${zl(s.transport)}` : 'w cenie']);
    if (s.plyta) lines.push([ADDONS.plyta.name, `+ ${ADDONS.plyta.note}`]);
    lines.push(['Formalności i projekt', 'po naszej stronie']);
    linesEl.innerHTML = lines.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('');
  };

  form.addEventListener('input', render);
  render();

  const validate = () => {
    let ok = true;
    form.querySelectorAll('[data-required]').forEach((input) => {
      const err = form.querySelector(`#${input.id}-err`);
      const bad = !input.value.trim() || (input.type === 'tel' && input.value.replace(/\D/g, '').length < 9);
      input.setAttribute('aria-invalid', String(bad));
      if (err) err.hidden = !bad;
      if (bad && ok) { input.focus(); ok = false; }
    });
    return ok;
  };

  const message = () => {
    const s = state();
    const fd = new FormData(form);
    return [
      'Dzień dobry, proszę o wycenę domu DOM90.',
      `Metraż: ${s.m} m²`,
      `Standard: ${NAMES[s.std]}`,
      `Sypialnie: ${s.beds}`,
      `Odległość działki od Serok: ok. ${s.km} km`,
      s.plyta ? 'Płyta fundamentowa: tak' : null,
      `Termin rozpoczęcia: ${fd.get('start')}`,
      `Forma płatności: ${fd.get('payment')}`,
      fd.get('info') ? `Dodatkowo: ${fd.get('info')}` : null,
      `Wycena z konfiguratora: ${zl(s.total)} brutto`,
      '',
      `${fd.get('name')}, tel. ${fd.get('phone')}${fd.get('email') ? ', ' + fd.get('email') : ''}`,
    ].filter((l) => l !== null).join('\n');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const via = e.submitter?.value || 'mail';
    const text = message();
    if (via === 'wa') {
      window.open(`https://wa.me/48574742292?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else {
      location.href = `mailto:kontakt@dom90.pl?subject=${encodeURIComponent('Wycena domu DOM90')}&body=${encodeURIComponent(text)}`;
    }
    status.hidden = false;
    status.textContent = via === 'wa'
      ? 'Otworzyliśmy WhatsApp z gotową wiadomością. Wystarczy ją wysłać.'
      : 'Otworzyliśmy Twój program pocztowy z gotową wiadomością. Jeśli się nie otworzył, zadzwoń: 574 742 292.';
  });

  form.querySelectorAll('[data-required]').forEach((input) => input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') { input.setAttribute('aria-invalid', 'false'); const err = form.querySelector(`#${input.id}-err`); if (err) err.hidden = true; }
  }));
}
