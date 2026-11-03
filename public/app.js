'use strict';

/* ------------------------------------------------------------------ *
 * Storefront
 * ------------------------------------------------------------------ */

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    settings: null,
    products: [],
    catalogs: [],
    session: null,
    catalog: 'all',
    minimumOrder: 250,
    shippingAreas: [],
    query: '',
    sort: 'newest',
    activeProduct: null,
    lastFocus: null
  };

  const el = {
    boot: $('#boot'),
    loginView: $('#login-view'),
    storeView: $('#store-view'),
    loginForm: $('#login-form'),
    loginName: $('#login-name'),
    loginPhone: $('#login-phone'),
    loginSubmit: $('#login-submit'),
    loginError: $('#login-error'),
    loginNote: $('#login-note'),
    loginEyebrow: $('#login-eyebrow'),
    loginTitle: $('#login-title'),
    loginTagline: $('#login-tagline'),
    brand: $('#brand-name'),
    loginBrand: $('#login-brand-text'),
    footerBrand: $('#footer-brand-text'),
    footerTagline: $('#footer-tagline'),
    footerDelivery: $('#footer-delivery'),
    footerContact: $('#footer-contact'),
    heroTitle: $('#hero-title'),
    heroEyebrow: $('#hero-eyebrow'),
    tickerTrack: $('#ticker-track'),
    loginLocation: $('#login-location'),
    footerLocation: $('#footer-location'),
    heroLede: $('#hero-lede'),
    heroVisual: $('#hero-visual'),
    collectionCount: $('#collection-count'),
    chips: $('#category-chips'),
    search: $('#search-input'),
    sort: $('#sort-select'),
    grid: $('#product-grid'),
    empty: $('#empty-state'),
    emptyTitle: $('#empty-title'),
    emptyText: $('#empty-text'),
    clearFilters: $('#clear-filters'),
    steps: $('#order-steps'),
    deliveryNote: $('#delivery-note'),
    contactWhatsapp: $('#contact-whatsapp'),
    contactRows: $('#contact-rows'),
    userChip: $('#user-chip'),
    signout: $('#signout'),
    cartButton: $('#cart-button'),
    cartCount: $('#cart-count'),
    cartDrawer: $('#cart-drawer'),
    cartBody: $('#cart-body'),
    cartFoot: $('#cart-foot'),
    cartSubtotal: $('#cart-subtotal'),
    cartMinNote: $('#cart-min-note'),
    cartCheckout: $('#cart-checkout'),
    cartTitleCount: $('#cart-title-count'),
    modal: $('#product-modal'),
    modalBody: $('#modal-body'),
    modalClose: $('#modal-close'),
    toast: $('#toast'),
    year: $('#year'),
    footerCopyName: $('#footer-copy-name')
  };

  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function paragraphs(value) {
    const text = String(value || '').trim();
    if (!text) return '<p class="muted">No details added yet.</p>';
    return text
      .split(/\n\s*\n/)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function money(value) {
    const number = Number(value) || 0;
    return number.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function currency() {
    return (state.settings && state.settings.currency) || 'EGP';
  }

  function copyValue(key, fallback = '', vars = {}) {
    const copy = state.settings && state.settings.copy;
    let value = copy && typeof copy[key] === 'string' ? copy[key] : fallback;
    const replacements = {
      location: (state.settings && state.settings.location) || 'Cairo, Egypt',
      currency: currency(),
      ...vars
    };
    for (const [name, replacement] of Object.entries(replacements)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement));
    }
    return value;
  }

  function renderTicker() {
    if (!el.tickerTrack) return;
    const raw = copyValue('ticker', 'Handmade in small batches\nCairo & Giza delivery\nCash on delivery');
    const messages = raw.split('\n').map((line) => line.trim()).filter(Boolean);
    const half = messages.map((message) => `<span>${escapeHtml(message)}</span><span>·</span>`).join('');
    el.tickerTrack.innerHTML = half + half;
  }

  function applyCopy() {
    for (const node of $$('[data-copy]')) {
      const key = node.dataset.copy;
      node.textContent = copyValue(key, node.textContent);
    }
    for (const input of $$('[data-copy-placeholder]')) {
      input.placeholder = copyValue(input.dataset.copyPlaceholder, input.placeholder);
    }
    renderTicker();
  }

  function priceNow(product) {
    return product.discountPrice != null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  }

  function discountPercent(product) {
    if (product.discountPrice == null || product.discountPrice >= product.price || product.price <= 0) return 0;
    return Math.round((1 - product.discountPrice / product.price) * 100);
  }

  function waNumber() {
    return String((state.settings && state.settings.whatsapp) || '').replace(/[^\d]/g, '');
  }

  function contactLink(kind) {
    const s = state.settings || {};
    if (kind === 'whatsapp') {
      const digits = waNumber();
      return digits ? `https://wa.me/${digits}` : '';
    }
    if (kind === 'email') return s.email ? `mailto:${s.email}` : '';
    if (kind === 'phone') return s.phone ? `tel:${String(s.phone).replace(/\s+/g, '')}` : '';
    return '';
  }

  function productStockQty(product) {
    const quantity = Number(product.stockQty);
    if (Number.isFinite(quantity)) return Math.max(0, Math.floor(quantity));
    if (product.stock === 'out') return 0;
    if (product.stock === 'low') return 4;
    return 12;
  }

  function stockLabel(product) {
    const quantity = productStockQty(product);
    if (quantity <= 0) return { text: copyValue('soldOut', 'Sold out'), tone: 'out', qty: 0 };
    if (quantity <= 3) return { text: copyValue('onlyLeft', `Only ${quantity} left`, { qty: quantity }), tone: 'low', qty: quantity };
    return { text: copyValue('inStock', 'In stock'), tone: 'in', qty: quantity };
  }

  function initialOf(product) {
    return escapeHtml((product.title || '?').trim().charAt(0).toUpperCase());
  }

  function mediaMarkup(product, size = 'grid') {
    if (product.images && product.images.length) {
      return `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.title)}" loading="${size === 'grid' ? 'lazy' : 'eager'}" decoding="async">`;
    }
    return `<span class="media-fallback" aria-hidden="true"><span>${initialOf(product)}</span></span>`;
  }

  async function api(path, options = {}) {
    const init = { credentials: 'same-origin', ...options };
    if (init.body && typeof init.body !== 'string') {
      init.body = JSON.stringify(init.body);
      init.headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    }
    const response = await fetch(path, init);
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const error = new Error((data && data.error) || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  let toastTimer = null;
  function toast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    el.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-visible');
      setTimeout(() => { el.toast.hidden = true; }, 250);
    }, 3200);
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */

  async function boot() {
    el.year.textContent = new Date().getFullYear();

    try {
      const config = await api('/api/config');
      state.settings = config.settings;
      applySettings();
    } catch (error) {
      el.boot.innerHTML = `<p class="boot__error">The store could not load. ${escapeHtml(error.message)}</p>`;
      return;
    }

    try {
      const me = await api('/api/me');
      state.session = me.session;
    } catch {
      state.session = null;
    }

    el.boot.hidden = true;

    if (state.session) {
      enterStore();
    } else {
      showLogin();
    }
  }

  function renderBrandLogo(s) {
    const logos = $$('.js-brand-logo');
    const texts = $$('[data-brand-text]');
    for (const image of logos) {
      if (s.logo) {
        if (image.getAttribute('src') !== s.logo) image.src = s.logo;
        image.alt = `${s.storeName} logo`;
        image.hidden = false;
      } else {
        image.hidden = true;
        image.removeAttribute('src');
      }
    }
    for (const node of texts) node.hidden = Boolean(s.logo);
  }

  function applySettings() {
    const s = state.settings;
    document.title = `${s.storeName} — the collection`;
    for (const node of [el.brand, el.loginBrand, el.footerBrand]) {
      if (node) node.textContent = s.storeName;
    }
    renderBrandLogo(s);
    el.heroTitle.innerHTML = escapeHtml(s.tagline || 'A small collection, made to be used.');
    if (el.loginLocation) el.loginLocation.textContent = s.location || 'Cairo, Egypt';
    if (el.footerLocation) el.footerLocation.textContent = s.location || 'Cairo, Egypt';
    el.heroLede.textContent = s.intro || '';
    if (el.loginEyebrow) el.loginEyebrow.textContent = s.welcomeEyebrow || 'The collection';
    if (el.loginTitle) el.loginTitle.textContent = s.welcomeTitle || 'Made slowly,\nfor everyday\nrituals.';
    el.loginTagline.textContent = s.welcomeText || s.tagline || '';
    el.loginNote.textContent = s.customerNote || 'No password needed — leave your name and number so we can confirm your order.';
    el.deliveryNote.textContent = s.deliveryNote || '';
    el.footerTagline.textContent = s.tagline || '';
    el.footerDelivery.textContent = s.deliveryNote || '';
    if (el.footerCopyName) el.footerCopyName.textContent = s.storeName;
    document.documentElement.style.setProperty('--logo-height', `${Number(s.logoHeight) || 42}px`);
    document.body.classList.toggle('has-logo-plate', Boolean(s.logoPlate && s.logo));

    const wa = contactLink('whatsapp');
    if (wa) {
      el.contactWhatsapp.href = wa;
      el.contactWhatsapp.target = '_blank';
      el.contactWhatsapp.rel = 'noopener';
    } else {
      const mail = contactLink('email');
      el.contactWhatsapp.href = mail || '#';
      el.contactWhatsapp.target = '';
      const label = el.contactWhatsapp.querySelector('[data-contact-label]');
      if (label) label.textContent = mail ? 'Email the studio' : 'Contact details coming soon';
    }

    el.contactRows.innerHTML = [
      s.phone ? `<a href="${contactLink('phone')}">${escapeHtml(s.phone)}</a>` : '',
      s.email ? `<a href="${contactLink('email')}">${escapeHtml(s.email)}</a>` : '',
      s.instagram
        ? `<a href="https://instagram.com/${escapeHtml(s.instagram.replace(/^@/, ''))}" target="_blank" rel="noopener">@${escapeHtml(s.instagram.replace(/^@/, ''))}</a>`
        : ''
    ].filter(Boolean).join('');

    el.footerContact.innerHTML = `<h4>${escapeHtml(copyValue('footerContact', 'Contact'))}</h4>${[
      s.phone ? `<a href="${contactLink('phone')}">${escapeHtml(s.phone)}</a>` : '',
      s.email ? `<a href="${contactLink('email')}">${escapeHtml(s.email)}</a>` : '',
      s.whatsapp ? `<a href="${contactLink('whatsapp')}" target="_blank" rel="noopener">WhatsApp</a>` : ''
    ].filter(Boolean).join('')}`;

    el.steps.innerHTML = (s.orderSteps || []).map((step, index) => `
      <li>
        <span class="steps__num">${String(index + 1).padStart(2, '0')}</span>
        <span class="steps__body">
          <strong>${escapeHtml(step.title)}</strong>
          <span>${escapeHtml(step.text)}</span>
        </span>
      </li>`).join('');

    applyCopy();
  }

  /* ---------------------------------------------------------------- *
   * Login
   * ---------------------------------------------------------------- */

  function showLogin() {
    el.storeView.hidden = true;
    el.modal.hidden = true;
    el.modal.classList.remove('is-open');
    if (el.cartDrawer) {
      el.cartDrawer.hidden = true;
      el.cartDrawer.classList.remove('is-open');
    }
    document.body.classList.remove('is-locked');
    el.loginView.hidden = false;
    document.body.classList.add('is-login');
    setTimeout(() => el.loginName.focus(), 120);
  }

  el.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.loginError.hidden = true;
    const name = el.loginName.value.trim();
    const phone = el.loginPhone.value.trim();

    if (!name) {
      showLoginError('Please tell us your name.');
      el.loginName.focus();
      return;
    }

    if (!phone) {
      showLoginError('Add your phone number so we can confirm your order.');
      el.loginPhone.focus();
      return;
    }

    if (phone.replace(/\D/g, '').length < 7) {
      showLoginError('That phone number looks too short — add the full number.');
      el.loginPhone.focus();
      return;
    }

    el.loginSubmit.disabled = true;
    el.loginSubmit.classList.add('is-busy');
    try {
      const data = await api('/api/customer/login', { method: 'POST', body: { name, phone } });
      state.session = data.session;
      enterStore();
    } catch (error) {
      showLoginError(error.message);
    } finally {
      el.loginSubmit.disabled = false;
      el.loginSubmit.classList.remove('is-busy');
    }
  });

  function showLoginError(message) {
    el.loginError.textContent = message;
    el.loginError.hidden = false;
  }

  /* ---------------------------------------------------------------- *
   * Store
   * ---------------------------------------------------------------- */

  function enterStore() {
    document.body.classList.remove('is-login');
    el.loginView.hidden = true;
    el.storeView.hidden = false;

    renderSessionChip();
    renderSkeletons();
    loadProducts();
  }

  function renderSessionChip() {
    const session = state.session;
    if (!session) return;
    if (session.role === 'admin') {
      el.userChip.innerHTML = `<a class="chip-admin" href="/admin.html">Admin preview</a>`;
      el.signout.setAttribute('aria-label', 'Sign out');
      return;
    }
    const first = session.name.split(' ')[0];
    el.userChip.innerHTML = `<span class="avatar" aria-hidden="true">${escapeHtml(first.charAt(0).toUpperCase())}</span><span class="userchip__name">${escapeHtml(copyValue('greeting', `Salam, ${first}`, { name: first }))}</span>`;
  }

  async function loadProducts() {
    try {
      const data = await api('/api/products');
      state.products = data.products || [];
      state.catalogs = data.catalogs || [];
      state.minimumOrder = Number(data.minimumOrder) || 250;
      state.shippingAreas = data.shipping || [];
      if (state.catalog !== 'all' && !state.catalogs.some((catalog) => catalog.id === state.catalog)) {
        state.catalog = 'all';
      }
      reconcileCart();
      renderHero();
      renderChips();
      renderProducts();
      updateCartUI();
    } catch (error) {
      el.grid.innerHTML = '';
      if (error.status === 401) {
        state.session = null;
        showLogin();
        return;
      }
      toast(error.message);
    }
  }

  function renderSkeletons() {
    el.grid.innerHTML = Array.from({ length: 3 }).map(() => `
      <div class="product-card skeleton">
        <div class="skeleton__media"></div>
        <div class="skeleton__line skeleton__line--short"></div>
        <div class="skeleton__line"></div>
        <div class="skeleton__line skeleton__line--tiny"></div>
      </div>`).join('');
    el.collectionCount.textContent = 'Loading…';
  }

  function renderHero() {
    const featured = state.products.find((product) => product.featured) || state.products[0];
    if (!featured || !featured.images || !featured.images.length) {
      el.heroVisual.innerHTML = `
        <div class="hero-art" aria-hidden="true">
          <span class="hero-art__arch"></span>
          <span class="hero-art__note">Made by hand<br>in Cairo</span>
        </div>`;
      return;
    }

    const percent = discountPercent(featured);
    el.heroVisual.innerHTML = `
      <figure class="hero-frame">
        <img src="${escapeHtml(featured.images[0])}" alt="" decoding="async">
        <figcaption>${escapeHtml(featured.title)}</figcaption>
      </figure>
      <button class="hero-tag" type="button" data-hero-open="${escapeHtml(featured.id)}">
        <span class="hero-tag__label">${escapeHtml(copyValue('heroTagLabel', 'Studio price'))}</span>
        <span class="hero-tag__price">${escapeHtml(currency())} ${money(priceNow(featured))}</span>
        ${percent ? `<span class="hero-tag__save">${escapeHtml(copyValue('heroTagSave', `Save ${percent}%`, { percent }))}</span>` : ''}
      </button>`;
  }

  function renderChips() {
    let catalogs = state.catalogs.filter((catalog) =>
      state.products.some((product) => product.catalogId === catalog.id)
    );

    if (!catalogs.length) {
      const names = [...new Set(state.products.map((product) => product.category).filter(Boolean))];
      catalogs = names.map((name, index) => ({ id: `legacy-${index}`, name }));
    }

    const chips = [{ label: 'All pieces', value: 'all', count: state.products.length }].concat(
      catalogs.map((catalog) => ({
        label: catalog.name,
        value: catalog.id,
        count: state.products.filter((product) => product.catalogId === catalog.id).length
      }))
    );

    el.chips.innerHTML = chips.map((chip) => `
      <button class="chip ${state.catalog === chip.value ? 'is-active' : ''}" type="button"
        data-catalog-filter="${escapeHtml(chip.value)}" aria-pressed="${state.catalog === chip.value}">
        ${escapeHtml(chip.label)} <span>${chip.count}</span>
      </button>`).join('');
  }

  function visibleProducts() {
    const query = state.query.trim().toLowerCase();
    let list = state.products.filter((product) => {
      if (state.catalog !== 'all' && product.catalogId !== state.catalog) return false;
      if (!query) return true;
      const haystack = [product.title, product.tagline, product.category, product.description, (product.tags || []).join(' ')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    if (state.sort === 'price-asc') list = [...list].sort((a, b) => priceNow(a) - priceNow(b));
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => priceNow(b) - priceNow(a));
    if (state.sort === 'discount') list = [...list].sort((a, b) => discountPercent(b) - discountPercent(a));
    return list;
  }

  function renderProducts() {
    const list = visibleProducts();
    const total = state.products.length;

    el.collectionCount.textContent = total
      ? `${list.length} ${list.length === 1 ? 'piece' : 'pieces'} of ${total}`
      : 'No pieces yet';

    if (!total) {
      el.grid.innerHTML = '';
      el.empty.hidden = false;
      el.emptyTitle.textContent = copyValue('emptyStudioTitle', 'The studio is restocking.');
      el.emptyText.textContent = copyValue('emptyStudioText', 'New pieces are being photographed. Check back soon, or message us to hear first.');
      return;
    }

    if (!list.length) {
      el.grid.innerHTML = '';
      el.empty.hidden = false;
      el.emptyTitle.textContent = copyValue('emptySearchTitle', 'No pieces match that search.');
      el.emptyText.textContent = copyValue('emptySearchText', 'Try another word, or clear the filters to see the whole collection.');
      return;
    }

    el.empty.hidden = true;
    el.grid.innerHTML = list.map((product) => {
      const percent = discountPercent(product);
      const stock = stockLabel(product);
      const now = priceNow(product);
      const hasDiscount = percent > 0;

      return `
      <article class="product-card" data-id="${escapeHtml(product.id)}">
        <button class="product-card__media" type="button" data-open="${escapeHtml(product.id)}" aria-label="Open ${escapeHtml(product.title)}">
          ${mediaMarkup(product)}
          ${hasDiscount ? `<span class="badge">−${percent}%</span>` : ''}
          <span class="stock stock--${stock.tone}">${stock.text}</span>
        </button>
        <div class="product-card__body">
          <p class="product-card__cat">${escapeHtml(product.category)}</p>
          <h3 class="product-card__title">
            <button type="button" data-open="${escapeHtml(product.id)}">${escapeHtml(product.title)}</button>
          </h3>
          ${product.tagline ? `<p class="product-card__tagline">${escapeHtml(product.tagline)}</p>` : ''}
          <div class="price-row">
            <span class="price-now">${escapeHtml(currency())} ${money(now)}</span>
            ${hasDiscount ? `<s class="price-was">${escapeHtml(currency())} ${money(product.price)}</s>` : ''}
          </div>
          <div class="product-card__foot">
            <button class="link-btn" type="button" data-open="${escapeHtml(product.id)}">
              <span>${escapeHtml(copyValue('viewDetails', 'View details'))}</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>
            </button>
            <button class="mini-order mini-order--add" type="button" data-add="${escapeHtml(product.id)}" ${stock.qty <= 0 ? 'disabled' : ''}>
              ${stock.qty <= 0 ? escapeHtml(copyValue('soldOut', 'Sold out')) : escapeHtml(copyValue('addToCart', 'Add to cart'))}
            </button>
          </div>
        </div>
      </article>`;
    }).join('');
  }


  /* ---------------------------------------------------------------- *
   * Cart
   * ---------------------------------------------------------------- */

  function cartLines() {
    if (!window.ShopCart) return [];
    const byId = new Map(state.products.map((product) => [product.id, product]));
    const lines = [];
    for (const item of ShopCart.read()) {
      const product = byId.get(item.id);
      if (!product) continue;
      const max = productStockQty(product);
      if (max <= 0) continue;
      const qty = Math.max(1, Math.min(item.qty, max));
      lines.push({ product, qty, max, lineTotal: priceNow(product) * qty });
    }
    return lines;
  }

  function reconcileCart() {
    if (!window.ShopCart) return;
    const items = ShopCart.read();
    const byId = new Map(state.products.map((product) => [product.id, product]));
    const next = [];
    let changed = false;

    for (const item of items) {
      const product = byId.get(item.id);
      const max = product ? productStockQty(product) : 0;
      if (!product || max <= 0) {
        changed = true;
        continue;
      }
      const qty = Math.max(1, Math.min(item.qty, max));
      if (qty !== item.qty) changed = true;
      next.push({ id: item.id, qty });
    }

    if (changed) ShopCart.write(next);
  }

  function cartTotals(lines) {
    const quantity = lines.reduce((sum, line) => sum + line.qty, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    return { quantity, subtotal };
  }

  function updateCartUI() {
    if (!el.cartCount) return;
    const lines = cartLines();
    const { quantity } = cartTotals(lines);

    el.cartCount.textContent = String(quantity);
    el.cartCount.hidden = quantity === 0;
    el.cartButton.setAttribute('aria-label', quantity ? `Open cart, ${quantity} item${quantity === 1 ? '' : 's'}` : 'Open cart');
    el.cartTitleCount.textContent = quantity ? `(${quantity})` : '';

    renderCartBody(lines);
    renderCartFoot(lines);
  }

  function renderCartBody(lines) {
    if (!lines.length) {
      el.cartFoot.hidden = true;
      el.cartBody.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
          </span>
          <h3>${escapeHtml(copyValue('cartEmptyTitle', 'Your cart is empty'))}</h3>
          <p>${escapeHtml(copyValue('cartEmptyText', 'Add a few pieces from the collection and they will wait for you here.'))}</p>
          <button class="btn btn--ghost btn--sm" type="button" data-close-cart>${escapeHtml(copyValue('cartEmptyButton', 'Browse the collection'))}</button>
        </div>`;
      return;
    }

    el.cartFoot.hidden = false;
    el.cartBody.innerHTML = lines.map(({ product, qty, max }) => `
      <article class="cart-item" data-cart-id="${escapeHtml(product.id)}">
        <div class="cart-item__media">
          ${product.images && product.images.length
            ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.title)}" loading="lazy">`
            : `<span class="media-fallback"><span>${initialOf(product)}</span></span>`}
        </div>
        <div class="cart-item__main">
          <p class="cart-item__cat">${escapeHtml(product.category)}</p>
          <h3 class="cart-item__title">${escapeHtml(product.title)}</h3>
          <p class="cart-item__unit">${escapeHtml(currency())} ${money(priceNow(product))} ${escapeHtml(copyValue('cartEach', 'each'))}</p>
          <div class="qty qty--cart">
            <button type="button" data-cart-minus aria-label="Decrease quantity">−</button>
            <input type="number" data-cart-qty value="${qty}" min="1" max="${max}" inputmode="numeric" aria-label="Quantity for ${escapeHtml(product.title)}">
            <button type="button" data-cart-plus aria-label="Increase quantity" ${qty >= max ? 'disabled' : ''}>+</button>
          </div>
          ${qty >= max ? `<p class="cart-item__limit">${escapeHtml(copyValue('cartMax', `Maximum ${max} available`, { qty: max }))}</p>` : ''}
        </div>
        <div class="cart-item__end">
          <strong>${escapeHtml(currency())} ${money(priceNow(product) * qty)}</strong>
          <button class="cart-item__remove" type="button" data-cart-remove>${escapeHtml(copyValue('cartRemove', 'Remove'))}</button>
        </div>
      </article>`).join('');
  }

  function renderCartFoot(lines) {
    const { subtotal } = cartTotals(lines);
    const minimum = Number(state.minimumOrder) || 250;
    el.cartSubtotal.textContent = `${currency()} ${money(subtotal)}`;

    if (!lines.length) {
      el.cartMinNote.textContent = '';
      return;
    }

    if (subtotal < minimum) {
      el.cartMinNote.textContent = copyValue('cartAddMore', `Add ${currency()} ${money(minimum - subtotal)} more to reach the ${currency()} ${money(minimum)} minimum.`, {
        amount: `${currency()} ${money(minimum - subtotal)}`,
        minimum: `${currency()} ${money(minimum)}`
      });
      el.cartMinNote.classList.add('is-warning');
      el.cartCheckout.classList.add('is-disabled');
      el.cartCheckout.setAttribute('aria-disabled', 'true');
    } else {
      el.cartMinNote.textContent = copyValue('cartMinReached', 'Minimum reached — delivery is added at checkout.');
      el.cartMinNote.classList.remove('is-warning');
      el.cartCheckout.classList.remove('is-disabled');
      el.cartCheckout.removeAttribute('aria-disabled');
    }
  }

  let cartHideTimer = null;

  function openCart() {
    if (!el.cartDrawer) return;
    clearTimeout(cartHideTimer);
    updateCartUI();
    el.cartDrawer.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.cartDrawer.classList.add('is-open'));
    const close = el.cartDrawer.querySelector('button[data-close-cart]');
    if (close) close.focus();
  }

  function closeCart() {
    if (!el.cartDrawer || el.cartDrawer.hidden) return;
    el.cartDrawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    clearTimeout(cartHideTimer);
    cartHideTimer = setTimeout(() => { el.cartDrawer.hidden = true; }, 200);
  }

  function addToCart(productId, quantity = 1) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    const max = productStockQty(product);
    if (max <= 0) {
      toast('That piece is sold out.');
      return;
    }
    const existing = cartLines().find((line) => line.product.id === productId);
    const before = existing ? existing.qty : 0;
    const after = ShopCart.add(productId, quantity, max);
    if (after <= before) {
      toast(`Only ${max} available — your cart is already at the maximum.`);
      return;
    }
    if (after < before + quantity) {
      toast(`Only ${max} available — cart updated.`);
    } else {
      toast(`Added to cart.`);
    }
  }

  el.cartButton.addEventListener('click', openCart);

  el.cartDrawer.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-cart]') || event.target.classList.contains('cart-drawer__backdrop')) {
      closeCart();
    }
  });

  el.cartBody.addEventListener('click', (event) => {
    const line = event.target.closest('[data-cart-id]');
    if (!line) return;
    const id = line.dataset.cartId;
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    const max = productStockQty(product);
    const input = line.querySelector('[data-cart-qty]');
    const qty = Number(input && input.value) || 1;

    if (event.target.closest('[data-cart-plus]')) {
      ShopCart.setQty(id, qty + 1, max);
      return;
    }
    if (event.target.closest('[data-cart-minus]')) {
      ShopCart.setQty(id, qty - 1, max);
      return;
    }
    if (event.target.closest('[data-cart-remove]')) {
      ShopCart.remove(id);
      toast('Removed from cart.');
    }
  });

  el.cartBody.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-qty]');
    if (!input) return;
    const line = input.closest('[data-cart-id]');
    const product = state.products.find((item) => item.id === line.dataset.cartId);
    if (!product) return;
    const max = productStockQty(product);
    let qty = Math.floor(Number(input.value));
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > max) {
      qty = max;
      toast(`Only ${max} available.`);
    }
    ShopCart.setQty(line.dataset.cartId, qty, max);
  });

  el.cartCheckout.addEventListener('click', (event) => {
    const { subtotal } = cartTotals(cartLines());
    if (subtotal < (Number(state.minimumOrder) || 250)) {
      event.preventDefault();
      toast(`Minimum order is ${currency()} ${money(state.minimumOrder || 250)}.`);
    }
  });

  window.addEventListener('cart:change', updateCartUI);

  /* ---------------------------------------------------------------- *
   * Filters
   * ---------------------------------------------------------------- */

  el.chips.addEventListener('click', (event) => {
    const button = event.target.closest('[data-catalog-filter]');
    if (!button) return;
    state.catalog = button.dataset.catalogFilter;
    renderChips();
    renderProducts();
  });

  let searchTimer = null;
  el.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = el.search.value;
      renderProducts();
    }, 140);
  });

  el.sort.addEventListener('change', () => {
    state.sort = el.sort.value;
    renderProducts();
  });

  el.clearFilters.addEventListener('click', () => {
    state.catalog = 'all';
    state.query = '';
    el.search.value = '';
    renderChips();
    renderProducts();
    el.search.focus();
  });

  $('#search-toggle').addEventListener('click', () => {
    document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => el.search.focus({ preventScroll: true }), 400);
  });

  /* ---------------------------------------------------------------- *
   * Product modal
   * ---------------------------------------------------------------- */

  el.grid.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) {
      addToCart(add.dataset.add, 1);
      return;
    }
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const product = state.products.find((item) => item.id === trigger.dataset.open);
    if (product) openProduct(product, trigger);
  });

  el.heroVisual.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-hero-open]');
    if (!trigger) return;
    const product = state.products.find((item) => item.id === trigger.dataset.heroOpen);
    if (product) openProduct(product, trigger);
  });

  function openProduct(product, trigger) {
    state.activeProduct = product;
    state.lastFocus = trigger || null;
    const images = product.images || [];
    const percent = discountPercent(product);
    const stock = stockLabel(product);
    const now = priceNow(product);

    el.modalBody.innerHTML = `
      <div class="detail">
        <div class="detail__gallery">
          <div class="detail__stage">
            ${images.length
              ? `<img id="modal-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}">`
              : `<span class="media-fallback media-fallback--large" aria-hidden="true"><span>${initialOf(product)}</span></span>`}
            ${percent ? `<span class="badge badge--large">−${percent}%</span>` : ''}
          </div>
          ${images.length > 1 ? `
          <div class="detail__thumbs" role="tablist" aria-label="Product photos">
            ${images.map((image, index) => `
              <button class="thumb ${index === 0 ? 'is-active' : ''}" type="button" data-image="${escapeHtml(image)}" role="tab" aria-selected="${index === 0}" aria-label="Photo ${index + 1}">
                <img src="${escapeHtml(image)}" alt="" loading="lazy">
              </button>`).join('')}
          </div>` : ''}
        </div>

        <div class="detail__info">
          <p class="eyebrow">${escapeHtml(product.category)}</p>
          <h2 class="detail__title" id="modal-title">${escapeHtml(product.title)}</h2>
          ${product.tagline ? `<p class="detail__tagline">${escapeHtml(product.tagline)}</p>` : ''}

          <div class="detail__price">
            <span class="detail__now">${escapeHtml(currency())} ${money(now)}</span>
            ${percent ? `<s class="detail__was">${escapeHtml(currency())} ${money(product.price)}</s>` : ''}
            ${percent ? `<span class="detail__save">${escapeHtml(copyValue('detailSave', `Save ${percent}%`, { percent }))}</span>` : ''}
          </div>
          <p class="detail__stock stock--${stock.tone}"><span class="dot dot--${stock.tone}"></span>${escapeHtml(stock.qty <= 0
            ? copyValue('soldOut', 'Sold out')
            : stock.qty <= 3
              ? copyValue('onlyLeft', `Only ${stock.qty} left`, { qty: stock.qty })
              : [copyValue('inStock', 'In stock'), copyValue('available', `${stock.qty} available`, { qty: stock.qty })].filter(Boolean).join(' · '))}</p>

          <div class="detail__buy">
            <div class="qty qty--detail">
              <button type="button" data-detail-minus aria-label="Decrease quantity">−</button>
              <input type="number" id="detail-qty" value="1" min="1" max="${Math.max(1, stock.qty)}" inputmode="numeric" aria-label="Quantity">
              <button type="button" data-detail-plus aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn--primary" type="button" id="detail-add" ${stock.qty <= 0 ? 'disabled' : ''}>
              ${stock.qty <= 0 ? escapeHtml(copyValue('soldOut', 'Sold out')) : escapeHtml(copyValue('addToCart', 'Add to cart'))}
            </button>
          </div>
          <a class="btn btn--ghost detail__how" href="#how-to-order" data-close-modal>How ordering works</a>
          ${state.settings && state.settings.deliveryNote ? `<p class="detail__delivery">${escapeHtml(state.settings.deliveryNote)}</p>` : ''}

          <div class="detail__accordions">
            <details open>
              <summary>${escapeHtml(copyValue('modalDescription', 'Description'))}</summary>
              <div class="detail__prose">${paragraphs(product.description)}</div>
            </details>
            <details>
              <summary>${escapeHtml(copyValue('modalHowToUse', 'How to use'))}</summary>
              <div class="detail__prose">${paragraphs(product.howToUse)}</div>
            </details>
            <details>
              <summary>${escapeHtml(copyValue('modalHowToOrder', 'How to order'))}</summary>
              <div class="detail__prose">${paragraphs(product.howToOrder)}</div>
            </details>
          </div>

          ${(product.tags || []).length ? `<ul class="detail__tags">${product.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`;

    el.modal.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.modal.classList.add('is-open'));
    el.modalClose.focus();

    $$('.thumb', el.modalBody).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const image = $('#modal-image');
        if (image) image.src = thumb.dataset.image;
        $$('.thumb', el.modalBody).forEach((node) => {
          node.classList.toggle('is-active', node === thumb);
          node.setAttribute('aria-selected', String(node === thumb));
        });
      });
    });

    const qtyInput = $('#detail-qty', el.modalBody);
    const addButton = $('#detail-add', el.modalBody);
    const maxQty = Math.max(1, stock.qty);

    function readDetailQty() {
      let value = Math.floor(Number(qtyInput.value));
      if (!Number.isFinite(value) || value < 1) value = 1;
      if (value > maxQty) value = maxQty;
      qtyInput.value = String(value);
      return value;
    }

    $('[data-detail-minus]', el.modalBody).addEventListener('click', () => {
      qtyInput.value = String(Math.max(1, readDetailQty() - 1));
    });
    $('[data-detail-plus]', el.modalBody).addEventListener('click', () => {
      qtyInput.value = String(Math.min(maxQty, readDetailQty() + 1));
    });
    qtyInput.addEventListener('change', readDetailQty);

    addButton.addEventListener('click', () => {
      const qty = readDetailQty();
      addToCart(product.id, qty);
      closeModal(false);
      openCart();
    });
  }

  function closeModal(restoreFocus = true) {
    if (el.modal.hidden) return;
    el.modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      el.modal.hidden = true;
      el.modalBody.innerHTML = '';
      state.activeProduct = null;
      if (restoreFocus && state.lastFocus && document.contains(state.lastFocus)) state.lastFocus.focus();
    }, 180);
  }

  el.modalClose.addEventListener('click', closeModal);
  el.modal.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-close-modal]');
    if (closer) {
      const hash = closer.getAttribute('href') || '';
      if (hash.startsWith('#') && hash.length > 1) {
        event.preventDefault();
        const target = document.querySelector(hash);
        closeModal();
        setTimeout(() => {
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 220);
        return;
      }
      closeModal();
      return;
    }
    if (event.target.classList.contains('modal__backdrop')) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!el.modal.hidden) closeModal();
    if (el.cartDrawer && !el.cartDrawer.hidden) closeCart();
  });

  /* ---------------------------------------------------------------- *
   * Sign out
   * ---------------------------------------------------------------- */

  el.signout.addEventListener('click', async () => {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    state.session = null;
    state.products = [];
    if (window.ShopCart) ShopCart.clear();
    window.location.href = '/';
  });

  $$('.js-brand-logo').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      $$('[data-brand-text]').forEach((node) => { node.hidden = false; });
    });
  });

  boot();
})();
