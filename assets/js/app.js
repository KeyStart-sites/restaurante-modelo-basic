/* =======================================================
   App.js — núcleo estável do template (universal)
   - Lê assets/data/config.json (textos, imagens, contatos)
   - Lê assets/data/menu.json (PLANO ou AGRUPADO)
   - Monta filtros dinâmicos e renderiza o cardápio
   - Preenche todos os botões [data-whats-link]
   ======================================================= */

const PATHS = {
  config: 'assets/data/config.json',
  menu:   'assets/data/menu.json'
};

const els = {
  // header / nav
  logo: document.getElementById('logo-img') || document.querySelector('.logo img'),
  nav: document.getElementById('nav'),

  // hero
  heroTitle: document.querySelector('.hero__text h1'),
  heroSub: document.querySelector('.hero__text p'),
  heroImg: document.querySelector('.hero__media img'),

  // cardápio
  filters: document.getElementById('filters'),
  grid: document.getElementById('grid-cardapio'),

  // sobre
  aboutSection: document.querySelector('#sobre .about__text'),
  aboutTitle: document.querySelector('#sobre h2'),
  aboutImg: document.querySelector('#sobre img'),

  // contato
  contatoTel: document.getElementById('contato-telefone'),
  contatoEnd: document.getElementById('contato-endereco'),
  contatoWhats: document.getElementById('contato-whats'),
  contatoEmail: document.getElementById('contato-email'),
  mapIframe: document.querySelector('#contato .map iframe'),

  // footer
  year: document.getElementById('year'),
  footerNome: document.getElementById('footer-nome')
};

/* Estado */
let cfg = {};
let itensCardapio = [];
let categorias = [];

/* Utils */
const PH_IMG = 'https://images.unsplash.com/photo-1548365328-9f547fb0953b?auto=format&fit=crop&w=800&q=60';

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, s => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]
  ));
}
function formatarCategoria(c){
  if (!c) return '';
  if (c === 'Tudo') return 'Tudo';
  if (c === 'pratosPrincipais' || c === 'PratosPrincipais') return 'Pratos principais';
  return c.charAt(0).toUpperCase() + c.slice(1);
}
function makeWhatsLink(numero, msgEnc){
  const n = (numero || '').replace(/[^\d]/g, '');
  if (!n) return '#';
  return `https://wa.me/${n}${msgEnc ? `?text=${msgEnc}` : ''}`;
}
function setAllWhatsLinks(numero, message){
  const url = makeWhatsLink(numero, message ? encodeURIComponent(message) : '');
  const nodes = document.querySelectorAll('[data-whats-link]');
  nodes.forEach(a => {
    if (url === '#') {
      a.setAttribute('aria-disabled','true');
      a.removeAttribute('href');
    } else {
      a.removeAttribute('aria-disabled');
      a.href = url;
    }
  });
}

/* Boot */
if (els.year) els.year.textContent = new Date().getFullYear();
init();

async function init(){
  await carregarConfig();
  await carregarMenu();
  // menu mobile é controlado pelo script inline do index.html (evita duplicação)
}

/* ========= config.json ========= */
async function carregarConfig(){
  try{
    const res = await fetch(PATHS.config, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cfg = await res.json();

    // Títulos / marca
    if (cfg.siteName) {
      document.title = `${cfg.siteName} • Cardápio e Pedidos`;
      if (els.footerNome) els.footerNome.textContent = cfg.siteName;
      const fb = document.querySelector('.logo .logo-fallback');
      if (fb) fb.textContent = cfg.siteName;
    }

    // ===== Logo robusta com fallback =====
    setLogoRobusta(cfg.logo, cfg.siteName);

    // ===== Hero (imagem com fallback + textos) =====
    setHeroImagem(cfg.heroImage);
    if (els.heroTitle && cfg.hero?.title) els.heroTitle.textContent = cfg.hero.title;
    if (els.heroSub && cfg.hero?.subtitle) els.heroSub.textContent = cfg.hero.subtitle;

    // ===== Sobre =====
    if (els.aboutTitle && cfg.about?.title) els.aboutTitle.textContent = cfg.about.title;
    if (els.aboutImg && cfg.about?.image) els.aboutImg.src = cfg.about.image;

    if (els.aboutSection){
      const actions = els.aboutSection.querySelector('.actions');
      const existingPs = Array.from(els.aboutSection.querySelectorAll('p'));
      const desired = Array.isArray(cfg.about?.paragraphs) ? cfg.about.paragraphs : [];

      while (existingPs.length < desired.length) {
        const p = document.createElement('p');
        els.aboutSection.insertBefore(p, actions);
        existingPs.push(p);
      }
      existingPs.forEach((p, i) => {
        if (desired[i]) {
          p.style.display = '';
          p.textContent = desired[i];
        } else {
          p.textContent = '';
          p.style.display = 'none';
        }
      });

      const ctas = els.aboutSection.querySelectorAll('.actions a');
      if (ctas[0]) ctas[0].textContent = cfg.about?.ctaPrimary || 'Pedir no WhatsApp';
      if (ctas[1]) ctas[1].textContent = cfg.about?.ctaSecondary || 'Ver cardápio';
    }

    // ===== Contato / mapa =====
    if (els.contatoTel && cfg.phone) els.contatoTel.textContent = cfg.phone;
    if (els.contatoEnd && cfg.address) els.contatoEnd.textContent = cfg.address;
    if (els.contatoEmail && cfg.email) els.contatoEmail.href = `mailto:${cfg.email}`;
    if (els.mapIframe && cfg.mapSrc) els.mapIframe.src = cfg.mapSrc;

    // ===== WhatsApp em todos os botões =====
    setAllWhatsLinks(cfg.whatsapp);

  }catch(e){
    console.error('Falha ao carregar config.json', e);
    setAllWhatsLinks('');
  }
}

/* ========= menu.json (PLANO ou AGRUPADO) ========= */
async function carregarMenu(){
  try{
    const res = await fetch(PATHS.menu, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    itensCardapio = normalizarMenu(raw);
    categorias = extrairCategorias(itensCardapio);
    montarFiltros(categorias);
    renderizarGrade(itensCardapio);

    if (els.filters){
      els.filters.addEventListener('click', e => {
        const btn = e.target.closest('button.chip'); if (!btn) return;
        els.filters.querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        renderizarGrade(cat === 'Tudo' ? itensCardapio : itensCardapio.filter(i => i.categoria === cat));
      });
    }

  }catch(e){
    console.error('Falha ao carregar menu.json', e);
    if (els.grid) els.grid.innerHTML = '<p>Não foi possível carregar o cardápio.</p>';
  }
}

/* —— Compatibilidade —— */
function normalizarMenu(raw){
  // Já é plano?
  if (Array.isArray(raw)) return raw.map(i => ({ ...i, categoria: i.categoria || 'Outros' }));

  // Agrupado: { Entradas:[...], PratosPrincipais:[...], ... }
  if (raw && typeof raw === 'object'){
    return Object.entries(raw).flatMap(([cat, arr]) =>
      (arr || []).map(i => ({ ...i, categoria: i.categoria || cat }))
    );
  }
  return [];
}
function extrairCategorias(itens){
  const ordem = [];
  itens.forEach(i => { if (i.categoria && !ordem.includes(i.categoria)) ordem.push(i.categoria); });
  return ['Tudo', ...ordem];
}

/* —— UI: filtros e grid —— */
function montarFiltros(cats){
  if (!els.filters) return;
  els.filters.innerHTML = cats.map((c, idx) =>
    `<button class="chip${idx===0?' is-active':''}" data-filter="${escapeHtml(c)}">${formatarCategoria(c)}</button>`
  ).join('');
}

function renderizarGrade(lista){
  if (!els.grid) return;
  els.grid.innerHTML = lista.map(item => {
    const precoNum = Number(item.preco ?? 0);
    const preco = isNaN(precoNum)
      ? '—'
      : precoNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const msg = `Olá! Quero pedir: ${item.nome}${item.categoria ? ` (${formatarCategoria(item.categoria)})` : ''}.`;
    const href = makeWhatsLink(cfg.whatsapp, encodeURIComponent(msg));

    return `
      <article class="card" data-cat="${escapeHtml(item.categoria)}">
        <div class="card__media">
          <img
            src="${escapeHtml(item.imagem || PH_IMG)}"
            alt="${escapeHtml(item.nome)}"
            loading="lazy"
            referrerpolicy="no-referrer"
            onerror="this.onerror=null;this.src='${PH_IMG}'"
          >
        </div>
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(item.nome)}</h3>
          <p class="card__desc">${escapeHtml(item.descricao || '')}</p>
          <div class="card__row">
            <span class="price">R$ ${preco}</span>
            <a class="btn btn--small" ${href==='#' ? 'aria-disabled="true"' : `href="${href}" target="_blank" rel="noopener"`}>Pedir</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ===== Helpers de imagem (logo/hero) ===== */
function setLogoRobusta(urlLogo, siteName){
  const imgEl = els.logo;
  const fb = document.querySelector('.logo .logo-fallback');
  if (!imgEl) return;

  if (fb && siteName) fb.textContent = siteName;

  // Se não veio URL externa, mantém a local definida no HTML
  const url = (urlLogo || '').trim();
  if (!url) return;

  // Se a externa falhar, volta para local. Se local falhar, mostra texto.
  function showFallbackTexto(){
    if (imgEl) imgEl.style.display = 'none';
    if (fb) fb.classList.add('is-visible');
  }

  imgEl.referrerPolicy = 'no-referrer';
  imgEl.addEventListener('error', () => {
    console.warn('[KeyStart] Logo externa falhou. Usando local.');
    imgEl.removeEventListener('error', showFallbackTexto);
    imgEl.addEventListener('error', showFallbackTexto, { once: true });
    imgEl.src = 'assets/img/logo.jpg';
  }, { once: true });

  imgEl.style.display = '';
  imgEl.src = url;
}

function setHeroImagem(url){
  if (!els.heroImg) return;
  const src = (url || '').trim();
  els.heroImg.referrerPolicy = 'no-referrer';

  if (src) {
    els.heroImg.addEventListener('error', () => {
      console.warn('[KeyStart] heroImage falhou. Usando fallback local.');
      els.heroImg.src = 'assets/img/hero.jpg';
    }, { once: true });
    els.heroImg.src = src;
  } else {
    els.heroImg.src = 'assets/img/hero.jpg';
  }
}
