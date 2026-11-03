'use strict';

/* ------------------------------------------------------------------ *
 * Checkout
 * ------------------------------------------------------------------ */

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    settings: null,
    session: null,
    products: [],
    lines: [],
    areas: [],
    minimumOrder: 250,
    adjusted: false
  };

  const el = {
    boot: $('#checkout-boot'),
    gate: $('#checkout-gate'),
    empty: $('#checkout-empty'),
    main: $('#checkout-main'),
    success: $('#checkout-success'),
    successText: $('#checkout-success-text'),
    successLink: $('#checkout-whatsapp-link'),
    form: $('#checkout-form'),
    error: $('#checkout-error'),
    submit: $('#place-order'),
    brand: $('#checkout-brand'),
    logos: $$('.js-brand-logo'),
    summaryItems: $('#summary-items'),
    summaryCount: $('#summary-count'),
    subtotal: $('#summary-subtotal'),
    shipping: $('#summary-shipping'),
    areaLabel: $('#summary-area'),
    total: $('#summary-total'),
    minNote: $('#summary-min')
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function applyCopy() {
    for (const node of $$('[data-copy]')) {
      node.textContent = copyValue(node.dataset.copy, node.textContent);
    }
    for (const input of $$('[data-copy-placeholder]')) {
      input.placeholder = copyValue(input.dataset.copyPlaceholder, input.placeholder);
    }
  }

  function priceNow(product) {
    return product.discountPrice != null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  }

  function productStockQty(product) {
    const quantity = Number(product.stockQty);
    if (Number.isFinite(quantity)) return Math.max(0, Math.floor(quantity));
    if (product.stock === 'out') return 0;
    if (product.stock === 'low') return 4;
    return 12;
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

  function setBusy(button, busy, label) {
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.classList.toggle('is-busy', busy);
    button.textContent = busy ? label : button.dataset.label;
  }

  function showGate() {
    el.boot.hidden = true;
    el.gate.hidden = false;
    el.empty.hidden = true;
    el.main.hidden = true;
  }

  function showEmpty() {
    el.boot.hidden = true;
    el.gate.hidden = true;
    el.empty.hidden = false;
    el.main.hidden = true;
  }

  function applyBrand() {
    const s = state.settings;
    if (!s) return;
    document.title = `Checkout — ${s.storeName}`;
    if (el.brand) el.brand.textContent = s.storeName;
    document.documentElement.style.setProperty('--logo-height', `${Number(s.logoHeight) || 42}px`);
    document.body.classList.toggle('has-logo-plate', Boolean(s.logoPlate && s.logo));

    for (const image of el.logos) {
      if (s.logo) {
        image.src = s.logo;
        image.alt = `${s.storeName} logo`;
        image.hidden = false;
      } else {
        image.hidden = true;
      }
    }
    $$('[data-brand-text]').forEach((node) => { node.hidden = Boolean(s.logo); });
    applyCopy();
  }

  function buildLines() {
    const byId = new Map(state.products.map((product) => [product.id, product]));
    const items = window.ShopCart ? ShopCart.read() : [];
    const next = [];
    const lines = [];
    let adjusted = false;

    for (const item of items) {
      const product = byId.get(item.id);
      const max = product ? productStockQty(product) : 0;
      if (!product || max <= 0) {
        adjusted = true;
        continue;
      }
      const qty = Math.max(1, Math.min(item.qty, max));
      if (qty !== item.qty) adjusted = true;
      next.push({ id: item.id, qty });
      lines.push({ product, qty, max, lineTotal: priceNow(product) * qty });
    }

    if (adjusted && window.ShopCart) ShopCart.write(next);
    state.adjusted = adjusted;
    return lines;
  }

  function selectedArea() {
    const input = $('input[name="city"]:checked');
    if (!input) return null;
    return state.areas.find((area) => area.id === input.value) || null;
  }

  function totals() {
    const subtotal = state.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const area = selectedArea();
    const shipping = area ? Number(area.fee) : 0;
    return { subtotal, area, shipping, total: subtotal + shipping };
  }

  function updateAreaStyles() {
    $$('.area-option').forEach((label) => {
      const input = $('input', label);
      label.classList.toggle('is-selected', Boolean(input && input.checked));
    });
  }

  function renderSummary() {
    const { subtotal, area, shipping, total } = totals();
    const quantity = state.lines.reduce((sum, line) => sum + line.qty, 0);

    el.summaryCount.textContent = quantity ? `${quantity} item${quantity === 1 ? '' : 's'}` : '';
    el.summaryItems.innerHTML = state.lines.map(({ product, qty }) => `
      <div class="summary-item">
        <div class="summary-item__media">
          ${product.images && product.images.length
            ? `<img src="${escapeHtml(product.images[0])}" alt="" loading="lazy">`
            : `<span class="media-fallback"><span>${escapeHtml((product.title || '?').charAt(0).toUpperCase())}</span></span>`}
        </div>
        <div class="summary-item__main">
          <strong>${escapeHtml(product.title)}</strong>
          <span>${qty} × ${escapeHtml(currency())} ${money(priceNow(product))}</span>
        </div>
        <span class="summary-item__total">${escapeHtml(currency())} ${money(priceNow(product) * qty)}</span>
      </div>`).join('');

    el.subtotal.textContent = `${currency()} ${money(subtotal)}`;
    el.shipping.textContent = area ? `${currency()} ${money(shipping)}` : copyValue('checkoutChooseArea', 'Choose area');
    el.areaLabel.textContent = area ? `· ${area.label}` : '';
    el.total.textContent = area
      ? `${currency()} ${money(total)}`
      : `${currency()} ${money(subtotal)}`;

    const minimum = Number(state.minimumOrder) || 250;
    const shortfall = minimum - subtotal;

    if (shortfall > 0) {
      el.minNote.textContent = `Add ${currency()} ${money(shortfall)} more — the minimum order is ${currency()} ${money(minimum)} before delivery.`;
      el.minNote.className = 'summary-min is-warning';
      el.submit.disabled = true;
      el.submit.textContent = copyValue('checkoutSubmit', 'Complete order');
      el.submit.setAttribute('aria-disabled', 'true');
    } else {
      el.minNote.textContent = state.adjusted
        ? 'Some quantities were adjusted to the stock available. Minimum order reached.'
        : 'Minimum order reached.';
      el.minNote.className = 'summary-min is-ok';
      el.submit.disabled = false;
      el.submit.removeAttribute('aria-disabled');
      el.submit.textContent = area
        ? `${copyValue('checkoutSubmit', 'Complete order')} — ${currency()} ${money(total)}`
        : copyValue('checkoutSubmit', 'Complete order');
    }
  }

  function prefill() {
    const form = el.form.elements;
    if (state.session && state.session.role === 'customer') {
      const name = String(state.session.name || '').trim();
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length) {
        form.firstName.value = parts[0];
        form.lastName.value = parts.slice(1).join(' ');
      }
      if (state.session.phone) {
        form.phone.value = state.session.phone;
        form.whatsapp.value = state.session.phone;
      }
    }
  }

  function showError(message) {
    el.error.textContent = message;
    el.error.hidden = false;
    el.error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function submitOrder(event) {
    event.preventDefault();
    el.error.hidden = true;

    const form = el.form.elements;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const phone = form.phone.value.trim();
    const whatsapp = form.whatsapp.value.trim();
    const address = form.address.value.trim();
    const area = selectedArea();
    const { subtotal } = totals();
    const minimum = Number(state.minimumOrder) || 250;

    if (!firstName) return showError('Enter your first name.');
    if (!lastName) return showError('Enter your last name.');
    if (!address || address.length < 8) return showError('Enter your full address so the courier can find you.');
    if (phone.replace(/\D/g, '').length < 7) return showError('Enter a valid phone number.');
    if (whatsapp.replace(/\D/g, '').length < 7) return showError('Enter a valid WhatsApp number.');
    if (!area) return showError('Choose Cairo & Giza or Alexandria for delivery.');
    if (subtotal < minimum) return showError(`The minimum order is ${currency()} ${money(minimum)} before delivery.`);

    setBusy(el.submit, true, 'Opening WhatsApp…');

    try {
      const data = await api('/api/orders', {
        method: 'POST',
        body: {
          items: state.lines.map((line) => ({ id: line.product.id, qty: line.qty })),
          firstName,
          lastName,
          phone,
          whatsapp,
          address,
          city: area.id
        }
      });

      if (window.ShopCart) ShopCart.clear();
      el.main.hidden = true;
      el.success.hidden = false;
      el.successText.textContent = `Order ${data.order.number} is ready. Opening WhatsApp so you can send it to the shop…`;
      el.successLink.href = data.whatsappUrl;
      el.success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        window.location.href = data.whatsappUrl;
      }, 900);
    } catch (error) {
      if (error.status === 401) {
        showGate();
        return;
      }
      showError(error.message);
      setBusy(el.submit, false, 'Opening WhatsApp…');
      renderSummary();
    }
  }

  async function boot() {
    try {
      const config = await api('/api/config');
      state.settings = config.settings;
      applyBrand();
    } catch (error) {
      el.boot.innerHTML = `<p class="boot__error">${escapeHtml(error.message)}</p>`;
      return;
    }

    try {
      const me = await api('/api/me');
      state.session = me.session;
    } catch {
      state.session = null;
    }

    if (!state.session) {
      showGate();
      return;
    }

    try {
      const data = await api('/api/products');
      state.products = data.products || [];
      state.areas = data.shipping || [];
      state.minimumOrder = Number(data.minimumOrder) || 250;
    } catch (error) {
      if (error.status === 401) {
        showGate();
        return;
      }
      el.boot.innerHTML = `<p class="boot__error">${escapeHtml(error.message)}</p>`;
      return;
    }

    state.lines = buildLines();
    el.boot.hidden = true;

    if (!state.lines.length) {
      showEmpty();
      return;
    }

    el.gate.hidden = true;
    el.empty.hidden = true;
    el.main.hidden = false;
    prefill();
    renderSummary();
    updateAreaStyles();

    el.form.addEventListener('submit', submitOrder);
    $$('input[name="city"]').forEach((input) => {
      input.addEventListener('change', () => {
        updateAreaStyles();
        renderSummary();
      });
    });

    el.successLink.addEventListener('click', () => {
      el.successText.textContent = 'Opening WhatsApp…';
    });

    $$('.js-brand-logo').forEach((image) => {
      image.addEventListener('error', () => {
        image.hidden = true;
        $$('[data-brand-text]').forEach((node) => { node.hidden = false; });
      });
    });
  }

  boot();
})();
