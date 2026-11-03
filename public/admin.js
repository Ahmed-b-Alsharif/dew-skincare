'use strict';

/* ------------------------------------------------------------------ *
 * Admin dashboard
 * ------------------------------------------------------------------ */

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    products: [],
    customers: [],
    orders: [],
    catalogs: [],
    settings: null,
    view: 'products',
    editing: null,
    editingCatalog: null,
    editingOrder: null,
    images: [],
    logo: '',
    search: '',
    customerSearch: '',
    orderSearch: '',
    uploading: false,
    defaultPassword: false
  };

  const el = {
    boot: $('#admin-boot'),
    login: $('#admin-login'),
    loginForm: $('#admin-login-form'),
    password: $('#admin-password'),
    loginSubmit: $('#admin-login-submit'),
    loginError: $('#admin-login-error'),
    passwordHint: $('#password-hint'),
    togglePassword: $('#toggle-password'),
    app: $('#admin-app'),
    brand: $('#admin-brand-text'),
    loginBrand: $('#login-brand-text'),
    navCount: $('#nav-count'),
    navCustomerCount: $('#nav-customer-count'),
    navOrderCount: $('#nav-order-count'),
    navCatalogCount: $('#nav-catalog-count'),
    navButtons: $$('.navbtn'),
    viewEyebrow: $('#view-eyebrow'),
    viewTitle: $('#view-title'),
    topbarActions: $('#topbar-actions'),
    views: {
      products: $('#view-products'),
      catalogs: $('#view-catalogs'),
      orders: $('#view-orders'),
      customers: $('#view-customers'),
      settings: $('#view-settings'),
      account: $('#view-account')
    },
    banner: $('#default-password-banner'),
    bannerChange: $('#banner-change-password'),
    statTotal: $('#stat-total'),
    statLive: $('#stat-live'),
    statOffer: $('#stat-offer'),
    statOut: $('#stat-out'),
    statCustomers: $('#stat-customers'),
    statOrderTotal: $('#stat-order-total'),
    statOrderPending: $('#stat-order-pending'),
    statOrderPaid: $('#stat-order-paid'),
    statOrderDelivered: $('#stat-order-delivered'),
    statReturning: $('#stat-returning'),
    statRecent: $('#stat-recent'),
    productCount: $('#product-count'),
    adminSearch: $('#admin-search'),
    rows: $('#product-rows'),
    customerCount: $('#customer-count'),
    customerSearch: $('#customer-search'),
    customerRows: $('#customer-rows'),
    orderCount: $('#order-count'),
    orderSearch: $('#order-search'),
    orderRows: $('#order-rows'),
    copyFields: $('#copy-fields'),
    catalogCount: $('#catalog-count'),
    catalogRows: $('#catalog-rows'),
    newCatalog: $('#new-catalog'),
    newProduct: $('#new-product'),
    settingsForm: $('#settings-form'),
    logoPreview: $('#logo-preview'),
    logoPreviewImg: $('#logo-preview-img'),
    logoEmpty: $('.logo-preview__empty'),
    uploadLogo: $('#upload-logo'),
    removeLogo: $('#remove-logo'),
    logoInput: $('#logo-input'),
    logoHeight: $('#logo-height'),
    logoSizeValue: $('#logo-size-value'),
    productCatalog: $('#product-catalog'),
    stepEditor: $('#step-editor'),
    addStep: $('#add-step'),
    saveSettings: $('#save-settings'),
    passwordForm: $('#password-form'),
    passwordError: $('#password-error'),
    logout: $('#admin-logout'),
    editor: $('#editor'),
    editorTitle: $('#editor-title'),
    editorEyebrow: $('#editor-eyebrow'),
    productForm: $('#product-form'),
    productError: $('#product-error'),
    saveProduct: $('#save-product'),
    imageDrop: $('#image-drop'),
    imageInput: $('#image-input'),
    imageList: $('#image-list'),
    uploadProgress: $('#upload-progress'),
    uploaderEmpty: $('.uploader__empty'),
    pricePreview: $('#price-preview'),
    catalogDialog: $('#catalog-dialog'),
    catalogForm: $('#catalog-form'),
    catalogDialogTitle: $('#catalog-dialog-title'),
    catalogError: $('#catalog-error'),
    saveCatalog: $('#save-catalog'),

    orderDrawer: $('#order-drawer'),
    orderForm: $('#order-form'),
    orderDrawerEyebrow: $('#order-drawer-eyebrow'),
    orderDrawerTitle: $('#order-drawer-title'),
    orderBody: $('#order-body'),
    saveOrder: $('#save-order'),
    deleteOrder: $('#delete-order'),

    confirm: $('#confirm-dialog'),
    confirmTitle: $('#confirm-title'),
    confirmText: $('#confirm-text'),
    confirmYes: $('#confirm-yes'),
    toast: $('#admin-toast'),
  };


  const COPY_GROUPS = [
    {
      title: 'Header, hero & scrolling bar',
      fields: [
        ['navCollection', 'Navigation — collection'],
        ['navHowToOrder', 'Navigation — how to order'],
        ['navContact', 'Navigation — contact'],
        ['heroEyebrow', 'Hero small line', 'text', 'Use {location} for the shop location.'],
        ['heroPrimary', 'Hero primary button'],
        ['heroSecondary', 'Hero second button'],
        ['heroPoint1', 'Hero note 1'],
        ['heroPoint2', 'Hero note 2'],
        ['heroPoint3', 'Hero note 3'],
        ['heroTagLabel', 'Hero price tag label'],
        ['heroTagSave', 'Hero saving tag', 'text', 'Use {percent} for the discount.'],
        ['ticker', 'Scrolling bar', 'textarea', 'One message per line. They repeat across the strip.']
      ]
    },
    {
      title: 'Collection',
      fields: [
        ['collectionEyebrow', 'Section small line'],
        ['collectionTitle', 'Section headline'],
        ['searchPlaceholder', 'Search placeholder'],
        ['sortLabel', 'Sort label'],
        ['sortNewest', 'Sort option — newest'],
        ['sortPriceAsc', 'Sort option — low to high'],
        ['sortPriceDesc', 'Sort option — high to low'],
        ['sortDiscount', 'Sort option — biggest saving'],
        ['allPieces', 'All pieces chip'],
        ['greeting', 'Customer greeting', 'text', 'Use {name} for their first name.'],
        ['emptyStudioTitle', 'Empty shop title'],
        ['emptyStudioText', 'Empty shop text', 'textarea'],
        ['emptySearchTitle', 'No-results title'],
        ['emptySearchText', 'No-results text', 'textarea'],
        ['viewDetails', 'View details link'],
        ['addToCart', 'Add to cart button'],
        ['soldOut', 'Sold out label'],
        ['onlyLeft', 'Low-stock label', 'text', 'Use {qty} for the number left.'],
        ['inStock', 'In-stock label'],
        ['available', 'Available label', 'text', 'Use {qty} for the quantity.']
      ]
    },
    {
      title: 'Ordering section & footer',
      fields: [
        ['orderingEyebrow', 'Ordering small line'],
        ['orderingTitle', 'Ordering headline', 'textarea'],
        ['contactEyebrow', 'Contact card small line'],
        ['contactTitle', 'Contact card title'],
        ['contactButton', 'WhatsApp button'],
        ['footerShop', 'Footer — shop heading'],
        ['footerContact', 'Footer — contact heading'],
        ['footerStudio', 'Footer — studio heading'],
        ['footerHours', 'Studio hours'],
        ['footerTax', 'Tax line', 'text', 'Use {currency} for the shop currency.']
      ]
    },
    {
      title: 'Welcome screen form',
      fields: [
        ['welcomeFormEyebrow', 'Form small line'],
        ['welcomeFormTitle', 'Form headline'],
        ['nameLabel', 'Name field label'],
        ['phoneLabel', 'Phone field label'],
        ['loginButton', 'Enter button'],
        ['loginFine', 'Small print under the form', 'textarea'],
        ['welcomeNote', 'Form note fallback', 'textarea', 'Used when Customer sign-in note is empty.']
      ]
    },
    {
      title: 'Cart & product panel',
      fields: [
        ['cartEyebrow', 'Cart small line'],
        ['cartTitle', 'Cart title'],
        ['cartEmptyTitle', 'Empty cart title'],
        ['cartEmptyText', 'Empty cart text', 'textarea'],
        ['cartEmptyButton', 'Empty cart button'],
        ['cartItems', 'Items total label'],
        ['cartComplete', 'Complete order button'],
        ['cartFine', 'Cart small print', 'textarea'],
        ['cartRemove', 'Remove link'],
        ['cartEach', '“each” word'],
        ['cartMax', 'Stock limit note', 'text', 'Use {qty} for the maximum.'],
        ['cartAddMore', 'Below-minimum note', 'text', 'Use {amount} and {minimum}.'],
        ['cartMinReached', 'Minimum-reached note'],
        ['modalDescription', 'Product panel — description'],
        ['modalHowToUse', 'Product panel — how to use'],
        ['modalHowToOrder', 'Product panel — how to order'],
        ['modalOrdering', 'Product panel — how ordering works']
      ]
    },
    {
      title: 'Checkout',
      fields: [
        ['checkoutEyebrow', 'Checkout small line'],
        ['checkoutTitle', 'Checkout headline'],
        ['checkoutLede', 'Checkout paragraph', 'textarea'],
        ['checkoutDetailsHeading', 'Details heading'],
        ['checkoutAreaHeading', 'Area heading'],
        ['checkoutFirstName', 'First name label'],
        ['checkoutLastName', 'Last name label'],
        ['checkoutPhone', 'Phone label'],
        ['checkoutWhatsapp', 'WhatsApp label'],
        ['checkoutAddress', 'Address label'],
        ['checkoutAddressNote', 'Address note'],
        ['checkoutAreaNote', 'Area note'],
        ['checkoutPayment', 'Payment heading'],
        ['checkoutPaymentNote', 'Payment note'],
        ['checkoutSubmit', 'Complete order button'],
        ['checkoutFine', 'Checkout small print', 'textarea'],
        ['checkoutSummary', 'Summary heading'],
        ['checkoutOrderEyebrow', 'Summary small line'],
        ['checkoutSuccessEyebrow', 'Success small line'],
        ['checkoutSuccessFine', 'Success small print'],
        ['checkoutEmptyEyebrow', 'Empty checkout small line'],
        ['checkoutEmptyTitle', 'Empty checkout title'],
        ['checkoutEmptyText', 'Empty checkout text', 'textarea'],
        ['checkoutEmptyButton', 'Empty checkout button'],
        ['checkoutGateEyebrow', 'Signed-out small line'],
        ['checkoutGateTitle', 'Signed-out title'],
        ['checkoutGateText', 'Signed-out text', 'textarea'],
        ['checkoutGateButton', 'Signed-out button'],
        ['checkoutItems', 'Items label'],
        ['checkoutDelivery', 'Delivery label'],
        ['checkoutTotal', 'Total label'],
        ['checkoutMinNote', 'Minimum order note', 'textarea'],
        ['checkoutChooseArea', 'Delivery — choose area'],
        ['checkoutSuccess', 'Success heading'],
        ['checkoutSuccessNote', 'Success paragraph'],
        ['checkoutSuccessButton', 'Success WhatsApp button']
      ]
    }
  ];

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

  function discountPercent(product) {
    if (product.discountPrice == null || product.discountPrice >= product.price || product.price <= 0) return 0;
    return Math.round((1 - product.discountPrice / product.price) * 100);
  }

  function shortDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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
    if (response.status === 401 && path !== '/api/admin/login') {
      showLogin();
      throw new Error('Your session ended. Sign in again.');
    }
    if (!response.ok) {
      throw new Error((data && data.error) || 'Something went wrong. Please try again.');
    }
    return data;
  }

  let toastTimer = null;
  function toast(message, tone = 'ok') {
    el.toast.textContent = message;
    el.toast.dataset.tone = tone;
    el.toast.hidden = false;
    el.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-visible');
      setTimeout(() => { el.toast.hidden = true; }, 250);
    }, 3400);
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle('is-busy', busy);
    if (label) {
      if (!button.dataset.label) button.dataset.label = button.textContent;
      button.textContent = busy ? label : button.dataset.label;
    }
  }

  /* ---------------------------------------------------------------- *
   * Boot + auth
   * ---------------------------------------------------------------- */

  async function boot() {
    try {
      const config = await api('/api/config');
      state.settings = config.settings;
      state.defaultPassword = Boolean(config.defaultPasswordHint);
      applyBrand();
      if (!state.defaultPassword && el.passwordHint) {
        el.passwordHint.textContent = 'This is the password you chose for the dashboard. Keep it somewhere safe — it is stored as a hash in data/db.json.';
      }
    } catch (error) {
      el.boot.innerHTML = `<p class="boot__error">${escapeHtml(error.message)}</p>`;
      return;
    }

    try {
      const me = await api('/api/me');
      if (me.session && me.session.role === 'admin') {
        showApp();
        return;
      }
    } catch {
      /* fall through to login */
    }

    el.boot.hidden = true;
    showLogin();
  }

  function renderLogos(logo, name) {
    const images = $$('.js-brand-logo');
    const texts = $$('[data-brand-text]');
    for (const image of images) {
      if (logo) {
        if (image.getAttribute('src') !== logo) image.src = logo;
        image.alt = `${name} logo`;
        image.hidden = false;
      } else {
        image.hidden = true;
        image.removeAttribute('src');
      }
    }
    for (const node of texts) node.hidden = Boolean(logo);
  }

  function applyBrand() {
    const name = (state.settings && state.settings.storeName) || 'Atelier Nour';
    if (el.brand) el.brand.textContent = name;
    if (el.loginBrand) el.loginBrand.textContent = name;
    renderLogos((state.settings && state.settings.logo) || '', name);
    const height = Number(state.settings && state.settings.logoHeight) || 42;
    document.documentElement.style.setProperty('--logo-height', `${height}px`);
    document.body.classList.toggle('has-logo-plate', Boolean(state.settings && state.settings.logoPlate && state.settings.logo));
    if (el.logoHeight) el.logoHeight.value = String(height);
    if (el.logoSizeValue) el.logoSizeValue.textContent = `${height} px`;
    document.title = `Dashboard — ${name}`;
    $$('.js-currency').forEach((node) => { node.textContent = currency(); });
  }

  function showLogin() {
    if (!el.editor.hidden) closeEditor();
    if (el.confirm.open) el.confirm.close();
    document.body.classList.remove('is-locked');
    el.app.hidden = true;
    el.login.hidden = false;
    el.boot.hidden = true;
    document.body.classList.add('is-admin-login');
    setTimeout(() => el.password.focus(), 120);
  }

  function showApp() {
    document.body.classList.remove('is-admin-login');
    el.login.hidden = true;
    el.boot.hidden = true;
    el.app.hidden = false;
    loadDashboard();
  }

  el.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.loginError.hidden = true;
    const password = el.password.value;
    if (!password) {
      showLoginError('Enter the admin password.');
      return;
    }

    setBusy(el.loginSubmit, true, 'Checking…');
    try {
      await api('/api/admin/login', { method: 'POST', body: { password } });
      el.password.value = '';
      showApp();
    } catch (error) {
      showLoginError(error.message);
      el.password.select();
    } finally {
      setBusy(el.loginSubmit, false, 'Checking…');
    }
  });

  function showLoginError(message) {
    el.loginError.textContent = message;
    el.loginError.hidden = false;
  }

  el.togglePassword.addEventListener('click', () => {
    const visible = el.password.type === 'text';
    el.password.type = visible ? 'password' : 'text';
    el.togglePassword.textContent = visible ? 'Show' : 'Hide';
    el.togglePassword.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  });

  el.logout.addEventListener('click', async () => {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    window.location.href = '/admin.html';
  });

  /* ---------------------------------------------------------------- *
   * Load + render
   * ---------------------------------------------------------------- */

  async function loadDashboard() {
    try {
      const [products, settings, customers, orders] = await Promise.all([
        api('/api/admin/products'),
        api('/api/admin/settings'),
        api('/api/admin/customers'),
        api('/api/admin/orders')
      ]);
      state.products = products.products || [];
      state.catalogs = products.catalogs || [];
      state.settings = settings.settings;
      state.customers = customers.customers || [];
      state.orders = orders.orders || [];
      applyBrand();
      renderAll();
      if (state.defaultPassword) el.banner.hidden = false;
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function renderAll() {
    renderStats();
    renderRows();
    renderCatalogs();
    renderCustomers();
    renderOrders();
    el.navCount.textContent = state.products.length;
    el.navCatalogCount.textContent = state.catalogs.length;
    el.navCustomerCount.textContent = state.customers.length;
    el.navOrderCount.textContent = state.orders.length;
  }

  function renderStats() {
    const offer = state.products.filter((product) => discountPercent(product) > 0).length;
    el.statTotal.textContent = state.products.length;
    el.statLive.textContent = state.products.filter((product) => product.active).length;
    el.statOffer.textContent = offer;
    el.statOut.textContent = state.products.filter((product) => Number(product.stockQty) <= 0).length;
  }

  function renderRows() {
    const query = state.search.trim().toLowerCase();
    const list = state.products.filter((product) => {
      if (!query) return true;
      return [product.title, product.category, (product.tags || []).join(' ')].join(' ').toLowerCase().includes(query);
    });

    el.productCount.textContent = query
      ? `${list.length} of ${state.products.length}`
      : `${state.products.length}`;

    if (!state.products.length) {
      el.rows.innerHTML = `
        <div class="admin-empty">
          <p class="eyebrow">An empty shop</p>
          <h3>Add your first piece</h3>
          <p class="muted">Upload a photo, set the price before and after the discount, and it appears on the storefront straight away.</p>
          <button class="btn btn--primary btn--sm" type="button" data-new>Add a product</button>
        </div>`;
      return;
    }

    if (!list.length) {
      el.rows.innerHTML = `<div class="admin-empty"><h3>No matches</h3><p class="muted">Nothing matches “${escapeHtml(state.search)}”.</p></div>`;
      return;
    }

    el.rows.innerHTML = list.map((product) => {
      const percent = discountPercent(product);
      const cover = product.images && product.images[0];
      const qty = Number(product.stockQty) || 0;
      const stockTone = qty <= 0 ? 'out' : qty <= 3 ? 'low' : 'in';
      const stockText = qty <= 0 ? 'Sold out' : qty <= 3 ? `Only ${qty} left` : `${qty} in stock`;

      return `
      <article class="product-row ${product.active ? '' : 'is-draft'}" data-id="${escapeHtml(product.id)}">
        <button class="product-row__thumb" type="button" data-edit="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.title)}">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : `<span class="media-fallback"><span>${escapeHtml(product.title.charAt(0))}</span></span>`}
        </button>

        <div class="product-row__main">
          <p class="product-row__cat">${escapeHtml(product.category || 'Collection')}</p>
          <h3><button type="button" data-edit="${escapeHtml(product.id)}">${escapeHtml(product.title)}</button></h3>
          <p class="product-row__meta">
            <span class="stock-dot stock-dot--${stockTone}"></span>${stockText}
            <span aria-hidden="true">·</span>${product.images.length} photo${product.images.length === 1 ? '' : 's'}
            ${product.updatedAt ? `<span aria-hidden="true">·</span>edited ${escapeHtml(shortDate(product.updatedAt))}` : ''}
          </p>
        </div>

        <div class="product-row__price">
          <strong>${escapeHtml(currency())} ${money(product.discountPrice != null ? product.discountPrice : product.price)}</strong>
          ${percent ? `<span class="product-row__was">${escapeHtml(currency())} ${money(product.price)}</span><span class="pill pill--offer">−${percent}%</span>` : '<span class="product-row__was">no discount</span>'}
        </div>

        <div class="product-row__live">
          <label class="switch switch--mini" title="${product.active ? 'Visible in the store' : 'Hidden from the store'}">
            <input type="checkbox" data-toggle="${escapeHtml(product.id)}" ${product.active ? 'checked' : ''} aria-label="Visible in the store">
            <span class="switch__track" aria-hidden="true"></span>
          </label>
          <span class="product-row__live-label">${product.active ? 'Live' : 'Hidden'}</span>
        </div>

        <div class="product-row__actions">
          <button class="row-btn" type="button" data-edit="${escapeHtml(product.id)}">Edit</button>
          <button class="row-btn row-btn--danger" type="button" data-delete="${escapeHtml(product.id)}" aria-label="Delete ${escapeHtml(product.title)}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>
          </button>
        </div>
      </article>`;
    }).join('');
  }

  function customerSeen(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function renderCustomers() {
    const customers = state.customers || [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    el.statCustomers.textContent = customers.length;
    el.statReturning.textContent = customers.filter((customer) => Number(customer.visits) > 1).length;
    el.statRecent.textContent = customers.filter((customer) => {
      const seen = Date.parse(customer.lastSeen);
      return Number.isFinite(seen) && seen >= weekAgo;
    }).length;
    el.navCustomerCount.textContent = customers.length;

    const query = state.customerSearch.trim().toLowerCase();
    const digitsQuery = query.replace(/\D/g, '');
    const list = customers.filter((customer) => {
      if (!query) return true;
      const name = String(customer.name || '').toLowerCase();
      const phone = String(customer.phone || '').toLowerCase();
      const digits = String(customer.phoneDigits || customer.phone || '').replace(/\D/g, '');
      return name.includes(query) || phone.includes(query) || (digitsQuery.length >= 3 && digits.includes(digitsQuery));
    });

    el.customerCount.textContent = query ? `${list.length} of ${customers.length}` : String(customers.length);

    if (!customers.length) {
      el.customerRows.innerHTML = `
        <div class="admin-empty">
          <p class="eyebrow">The list is empty</p>
          <h3>Customer details will appear here</h3>
          <p class="muted">When someone enters their name and phone number on the storefront, you will see them here — newest first.</p>
        </div>`;
      return;
    }

    if (!list.length) {
      el.customerRows.innerHTML = `<div class="admin-empty"><h3>No matches</h3><p class="muted">Nothing matches “${escapeHtml(state.customerSearch)}”.</p></div>`;
      return;
    }

    el.customerRows.innerHTML = list.map((customer) => {
      const name = customer.name || 'Customer';
      const initial = name.trim().charAt(0).toUpperCase() || '?';
      const phone = customer.phone || '';
      const digits = String(customer.phoneDigits || phone).replace(/\D/g, '');
      const visits = Number(customer.visits) || 1;

      return `
      <article class="customer-row">
        <span class="customer-row__avatar" aria-hidden="true">${escapeHtml(initial)}</span>
        <div class="customer-row__identity">
          <h3>${escapeHtml(name)}</h3>
          <a class="customer-row__phone" href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ''))}">${escapeHtml(phone)}</a>
        </div>
        <div class="customer-row__meta">
          <span class="customer-row__visits">${visits} ${visits === 1 ? 'visit' : 'visits'}</span>
          <span class="customer-row__seen">Last seen ${escapeHtml(customerSeen(customer.lastSeen))}</span>
        </div>
        <div class="customer-row__actions">
          ${digits ? `<a class="row-btn" href="https://wa.me/${digits}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          <button class="row-btn row-btn--danger" type="button" data-remove-customer="${escapeHtml(customer.id)}" aria-label="Delete ${escapeHtml(name)}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>
          </button>
        </div>
      </article>`;
    }).join('');
  }

  let customerSearchTimer = null;
  el.customerSearch.addEventListener('input', () => {
    clearTimeout(customerSearchTimer);
    customerSearchTimer = setTimeout(() => {
      state.customerSearch = el.customerSearch.value;
      renderCustomers();
    }, 120);
  });

  el.customerRows.addEventListener('click', async (event) => {
    const remove = event.target.closest('[data-remove-customer]');
    if (!remove) return;
    const customer = state.customers.find((item) => item.id === remove.dataset.removeCustomer);
    if (!customer) return;

    const confirmed = await confirmDialog({
      title: 'Delete this customer?',
      text: `${customer.name}'s name and phone number will be removed from the dashboard. They can still enter the store again later.`,
      confirmLabel: 'Delete customer'
    });
    if (!confirmed) return;

    try {
      await api(`/api/admin/customers/${encodeURIComponent(customer.id)}`, { method: 'DELETE' });
      state.customers = state.customers.filter((item) => item.id !== customer.id);
      renderCustomers();
      el.navCustomerCount.textContent = state.customers.length;
      toast('Customer removed.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  function renderCatalogOptions(selectedId) {
    if (!el.productCatalog) return;
    if (!state.catalogs.length) {
      el.productCatalog.innerHTML = '<option value="">No catalogs yet</option>';
      return;
    }
    el.productCatalog.innerHTML = state.catalogs
      .map((catalog) => `<option value="${escapeHtml(catalog.id)}">${escapeHtml(catalog.name)}</option>`)
      .join('');
    if (selectedId && state.catalogs.some((catalog) => catalog.id === selectedId)) {
      el.productCatalog.value = selectedId;
    }
  }

  function renderCatalogs() {
    if (!el.catalogRows) return;
    el.catalogCount.textContent = `${state.catalogs.length}`;
    el.navCatalogCount.textContent = state.catalogs.length;

    if (!state.catalogs.length) {
      el.catalogRows.innerHTML = `
        <div class="admin-empty">
          <p class="eyebrow">No catalogs yet</p>
          <h3>Create your first catalog</h3>
          <p class="muted">Use catalogs to group pieces — for example <strong>Body care</strong> for shower gel and moisturiser, or <strong>Makeup</strong> for lip gloss.</p>
          <button class="btn btn--primary btn--sm" type="button" data-new-catalog>New catalog</button>
        </div>`;
      return;
    }

    el.catalogRows.innerHTML = state.catalogs.map((catalog) => {
      const count = state.products.filter((product) => product.catalogId === catalog.id).length;
      return `
      <article class="catalog-row">
        <div class="catalog-row__mark" aria-hidden="true">${escapeHtml((catalog.name || '?').charAt(0).toUpperCase())}</div>
        <div class="catalog-row__main">
          <h3>${escapeHtml(catalog.name)}</h3>
          <p class="catalog-row__desc">${escapeHtml(catalog.description || 'No description yet.')}</p>
        </div>
        <span class="catalog-row__count">${count} ${count === 1 ? 'piece' : 'pieces'}</span>
        <div class="catalog-row__actions">
          <button class="row-btn" type="button" data-catalog-edit="${escapeHtml(catalog.id)}">Edit</button>
          <button class="row-btn row-btn--danger" type="button" data-catalog-delete="${escapeHtml(catalog.id)}" aria-label="Delete ${escapeHtml(catalog.name)}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>
          </button>
        </div>
      </article>`;
    }).join('');
  }

  function openCatalogDialog(catalog) {
    state.editingCatalog = catalog || null;
    el.catalogForm.reset();
    el.catalogError.hidden = true;
    el.catalogDialogTitle.textContent = catalog ? 'Edit catalog' : 'New catalog';
    el.saveCatalog.textContent = catalog ? 'Save changes' : 'Create catalog';
    if (catalog) {
      el.catalogForm.elements.name.value = catalog.name || '';
      el.catalogForm.elements.description.value = catalog.description || '';
    }
    el.catalogDialog.showModal();
    setTimeout(() => el.catalogForm.elements.name.focus(), 100);
  }

  function closeCatalogDialog() {
    if (el.catalogDialog.open) el.catalogDialog.close();
    state.editingCatalog = null;
  }

  el.newCatalog.addEventListener('click', () => openCatalogDialog(null));

  el.catalogRows.addEventListener('click', async (event) => {
    if (event.target.closest('[data-new-catalog]')) {
      openCatalogDialog(null);
      return;
    }

    const edit = event.target.closest('[data-catalog-edit]');
    if (edit) {
      const catalog = state.catalogs.find((item) => item.id === edit.dataset.catalogEdit);
      if (catalog) openCatalogDialog(catalog);
      return;
    }

    const remove = event.target.closest('[data-catalog-delete]');
    if (remove) {
      const catalog = state.catalogs.find((item) => item.id === remove.dataset.catalogDelete);
      if (!catalog) return;
      const confirmed = await confirmDialog({
        title: 'Delete this catalog?',
        text: `“${catalog.name}” will be removed. A catalog that still has pieces cannot be deleted.`,
        confirmLabel: 'Delete catalog'
      });
      if (!confirmed) return;
      try {
        const result = await api(`/api/admin/catalogs/${encodeURIComponent(catalog.id)}`, { method: 'DELETE' });
        state.catalogs = result.catalogs || [];
        renderAll();
        toast('Catalog deleted.');
      } catch (error) {
        toast(error.message, 'error');
      }
    }
  });

  $$('[data-close-catalog]').forEach((button) => {
    button.addEventListener('click', closeCatalogDialog);
  });

  el.catalogDialog.addEventListener('click', (event) => {
    if (event.target === el.catalogDialog) closeCatalogDialog();
  });

  el.catalogForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.catalogError.hidden = true;
    const name = el.catalogForm.elements.name.value.trim();
    const description = el.catalogForm.elements.description.value.trim();
    if (!name) {
      el.catalogError.textContent = 'Give the catalog a name.';
      el.catalogError.hidden = false;
      return;
    }

    const wasEditing = Boolean(state.editingCatalog);
    setBusy(el.saveCatalog, true, 'Saving…');
    try {
      const url = state.editingCatalog
        ? `/api/admin/catalogs/${encodeURIComponent(state.editingCatalog.id)}`
        : '/api/admin/catalogs';
      const result = await api(url, {
        method: state.editingCatalog ? 'PUT' : 'POST',
        body: { name, description }
      });
      state.catalogs = result.catalogs || [];
      if (result.catalog) {
        state.products.forEach((product) => {
          if (product.catalogId === result.catalog.id) product.category = result.catalog.name;
        });
      }
      renderAll();
      closeCatalogDialog();
      toast(wasEditing ? 'Catalog updated.' : 'Catalog created.');
    } catch (error) {
      el.catalogError.textContent = error.message;
      el.catalogError.hidden = false;
    } finally {
      setBusy(el.saveCatalog, false, 'Saving…');
    }
  });

  function formatOrderDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderOrders() {
    if (!el.orderRows) return;
    const orders = state.orders || [];
    const total = orders.length;

    el.statOrderTotal.textContent = total;
    el.statOrderPending.textContent = orders.filter((order) => !order.shipped && !order.delivered).length;
    el.statOrderPaid.textContent = orders.filter((order) => order.paid).length;
    el.statOrderDelivered.textContent = orders.filter((order) => order.delivered).length;
    el.navOrderCount.textContent = total;

    const query = state.orderSearch.trim().toLowerCase();
    const digitsQuery = query.replace(/\D/g, '');
    const list = orders.filter((order) => {
      if (!query) return true;
      const name = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase();
      const phone = String(order.customer?.phone || '').toLowerCase();
      const number = String(order.number || '').toLowerCase();
      const digits = phone.replace(/\D/g, '');
      return name.includes(query) || phone.includes(query) || number.includes(query) || (digitsQuery.length >= 3 && digits.includes(digitsQuery));
    });

    el.orderCount.textContent = query ? `${list.length} of ${total}` : String(total);

    if (!total) {
      el.orderRows.innerHTML = `
        <div class="admin-empty">
          <p class="eyebrow">No orders yet</p>
          <h3>Orders will appear here</h3>
          <p class="muted">When a customer completes checkout, the full order — name, number, address, products, delivery and total — is saved here. You can mark it paid, shipped or delivered and add a tracking number.</p>
        </div>`;
      return;
    }

    if (!list.length) {
      el.orderRows.innerHTML = `<div class="admin-empty"><h3>No matches</h3><p class="muted">Nothing matches “${escapeHtml(state.orderSearch)}”.</p></div>`;
      return;
    }

    el.orderRows.innerHTML = list.map((order) => {
      const name = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Customer';
      const qty = (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      const badges = [
        order.paid ? '<span class="order-badge order-badge--ok">Paid</span>' : '<span class="order-badge order-badge--warn">Unpaid</span>',
        order.delivered ? '<span class="order-badge order-badge--ok">Delivered</span>' : order.shipped ? '<span class="order-badge order-badge--info">Shipped</span>' : '<span class="order-badge">To ship</span>'
      ].join('');

      return `
      <article class="order-row" data-order-id="${escapeHtml(order.id)}">
        <div class="order-row__id">
          <strong>${escapeHtml(order.number)}</strong>
          <span>${escapeHtml(formatOrderDate(order.createdAt))}</span>
        </div>
        <div class="order-row__customer">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(order.customer?.phone || '')}</span>
          <span class="order-row__city">${escapeHtml(order.customer?.cityLabel || '')}</span>
        </div>
        <div class="order-row__meta">
          <span>${qty} ${qty === 1 ? 'item' : 'items'}</span>
          <div class="order-row__badges">${badges}</div>
        </div>
        <div class="order-row__total">
          <strong>${escapeHtml(order.currency || currency())} ${money(order.total)}</strong>
          ${order.tracking ? `<span>${escapeHtml(order.tracking)}</span>` : ''}
        </div>
        <button class="order-row__open" type="button" data-order-open="${escapeHtml(order.id)}">Manage</button>
      </article>`;
    }).join('');
  }

  function imageForOrderItem(item) {
    if (item.image) return item.image;
    const product = state.products.find((entry) => entry.id === item.productId);
    return product && product.images && product.images[0] ? product.images[0] : '';
  }

  function openOrder(order) {
    state.editingOrder = order;
    const name = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Customer';
    const digits = String(order.customer?.whatsapp || order.customer?.phone || '').replace(/\D/g, '');
    const items = order.items || [];

    el.orderDrawerEyebrow.textContent = `Order · ${formatOrderDate(order.createdAt)}`;
    el.orderDrawerTitle.textContent = order.number;

    el.orderBody.innerHTML = `
      <section class="order-detail-block">
        <div class="order-detail-block__head">
          <h3>Customer</h3>
          ${digits ? `<a class="row-btn" href="https://wa.me/${digits}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        </div>
        <div class="order-customer">
          <strong>${escapeHtml(name)}</strong>
          <div class="order-customer__links">
            ${order.customer?.phone ? `<a href="tel:${escapeHtml(String(order.customer.phone).replace(/[^\d+]/g, ''))}">${escapeHtml(order.customer.phone)}</a>` : ''}
            ${order.customer?.whatsapp ? `<span>WhatsApp: ${escapeHtml(order.customer.whatsapp)}</span>` : ''}
          </div>
          <p>${escapeHtml(order.customer?.address || '')}</p>
          <p class="order-customer__area">${escapeHtml(order.customer?.cityLabel || '')}</p>
        </div>
      </section>

      <section class="order-detail-block">
        <div class="order-detail-block__head"><h3>Items</h3></div>
        <div class="order-items">
          ${items.map((item) => {
            const image = imageForOrderItem(item);
            return `<div class="order-item">
              <div class="order-item__media">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : `<span class="media-fallback"><span>${escapeHtml((item.title || '?').charAt(0))}</span></span>`}</div>
              <div class="order-item__main">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.catalog || '')} · ${item.qty} × ${escapeHtml(order.currency || currency())} ${money(item.unitPrice)}</span>
              </div>
              <span class="order-item__total">${escapeHtml(order.currency || currency())} ${money(item.lineTotal)}</span>
            </div>`;
          }).join('')}
        </div>
        <dl class="order-detail-totals">
          <div><dt>Items</dt><dd>${escapeHtml(order.currency || currency())} ${money(order.subtotal)}</dd></div>
          <div><dt>Delivery (${escapeHtml(order.customer?.cityLabel || '')})</dt><dd>${escapeHtml(order.currency || currency())} ${money(order.shipping)}</dd></div>
          <div class="order-detail-total"><dt>Total</dt><dd>${escapeHtml(order.currency || currency())} ${money(order.total)}</dd></div>
        </dl>
      </section>

      <section class="order-detail-block">
        <div class="order-detail-block__head"><h3>Fulfilment</h3><span class="order-detail-hint">Saved with the order</span></div>
        <div class="order-status-grid">
          <label class="switch">
            <input type="checkbox" name="paid" ${order.paid ? 'checked' : ''}>
            <span class="switch__track" aria-hidden="true"></span>
            <span class="switch__text"><strong>Paid</strong><span>Payment received</span></span>
          </label>
          <label class="switch">
            <input type="checkbox" name="shipped" ${order.shipped ? 'checked' : ''}>
            <span class="switch__track" aria-hidden="true"></span>
            <span class="switch__text"><strong>Shipped</strong><span>Handed to the courier</span></span>
          </label>
          <label class="switch">
            <input type="checkbox" name="delivered" ${order.delivered ? 'checked' : ''}>
            <span class="switch__track" aria-hidden="true"></span>
            <span class="switch__text"><strong>Delivered</strong><span>Customer received it</span></span>
          </label>
        </div>
        <label class="field">
          <span class="field__label">Tracking number</span>
          <input name="tracking" type="text" maxlength="100" value="${escapeHtml(order.tracking || '')}" placeholder="Courier tracking number">
        </label>
        <label class="field">
          <span class="field__label">Notes</span>
          <textarea name="notes" rows="3" maxlength="1000" placeholder="Payment, delivery, courier or customer notes…">${escapeHtml(order.notes || '')}</textarea>
        </label>
      </section>`;

    el.orderDrawer.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.orderDrawer.classList.add('is-open'));
    const orderBody = $('#order-body');
    if (orderBody) orderBody.scrollTop = 0;
    const closeButton = el.orderDrawer.querySelector('button[data-close-order]');
    if (closeButton) closeButton.focus();
  }

  function closeOrder() {
    if (!el.orderDrawer || el.orderDrawer.hidden) return;
    el.orderDrawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      el.orderDrawer.hidden = true;
      el.orderBody.innerHTML = '';
      state.editingOrder = null;
    }, 200);
  }

  el.orderRows.addEventListener('click', (event) => {
    const button = event.target.closest('[data-order-open]');
    const row = event.target.closest('[data-order-id]');
    const id = button ? button.dataset.orderOpen : row ? row.dataset.orderId : null;
    if (!id) return;
    const order = state.orders.find((entry) => entry.id === id);
    if (order) openOrder(order);
  });

  let orderSearchTimer = null;
  el.orderSearch.addEventListener('input', () => {
    clearTimeout(orderSearchTimer);
    orderSearchTimer = setTimeout(() => {
      state.orderSearch = el.orderSearch.value;
      renderOrders();
    }, 120);
  });

  $$('[data-close-order]').forEach((button) => button.addEventListener('click', closeOrder));

  el.deleteOrder.addEventListener('click', async () => {
    if (!state.editingOrder) return;
    const order = state.editingOrder;
    const confirmed = await confirmDialog({
      title: 'Delete this order?',
      text: `${order.number} will be permanently removed from the dashboard. Stock is not changed.`,
      confirmLabel: 'Delete order'
    });
    if (!confirmed) return;
    try {
      await api(`/api/admin/orders/${encodeURIComponent(order.id)}`, { method: 'DELETE' });
      state.orders = state.orders.filter((entry) => entry.id !== order.id);
      renderOrders();
      closeOrder();
      toast('Order deleted.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  el.orderDrawer.addEventListener('click', (event) => {
    if (event.target.classList.contains('drawer__backdrop')) closeOrder();
  });

  el.orderForm.addEventListener('change', (event) => {
    if (event.target.name !== 'delivered' || !event.target.checked) return;
    const shipped = el.orderForm.elements.shipped;
    if (shipped) shipped.checked = true;
  });

  el.orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.editingOrder) return;
    const form = el.orderForm.elements;

    setBusy(el.saveOrder, true, 'Saving…');
    try {
      const result = await api(`/api/admin/orders/${encodeURIComponent(state.editingOrder.id)}`, {
        method: 'PUT',
        body: {
          paid: form.paid.checked,
          shipped: form.shipped.checked,
          delivered: form.delivered.checked,
          tracking: form.tracking.value,
          notes: form.notes.value
        }
      });
      const index = state.orders.findIndex((entry) => entry.id === result.order.id);
      if (index >= 0) state.orders[index] = result.order;
      renderOrders();
      closeOrder();
      toast('Order updated.');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(el.saveOrder, false, 'Saving…');
    }
  });

  /* ---------------------------------------------------------------- *
   * Navigation
   * ---------------------------------------------------------------- */

  const VIEW_META = {
    products: { eyebrow: 'Catalog', title: 'Products' },
    catalogs: { eyebrow: 'Storefront', title: 'Catalogs' },
    orders: { eyebrow: 'Sales', title: 'Orders' },
    customers: { eyebrow: 'Audience', title: 'Customers' },
    settings: { eyebrow: 'Storefront', title: 'Store settings' },
    account: { eyebrow: 'Security', title: 'Account' }
  };

  function setView(view) {
    state.view = view;
    for (const [name, section] of Object.entries(el.views)) {
      section.hidden = name !== view;
    }
    el.navButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
    el.viewEyebrow.textContent = VIEW_META[view].eyebrow;
    el.viewTitle.textContent = VIEW_META[view].title;

    el.topbarActions.innerHTML = view === 'products'
      ? `<button class="btn btn--primary btn--sm" type="button" data-topnew>+ New product</button>`
      : view === 'settings'
        ? `<button class="btn btn--primary btn--sm" type="button" data-savesettings>Save changes</button>`
        : '';

    if (view === 'settings') fillSettingsForm();
    if (view === 'customers') renderCustomers();
    if (view === 'catalogs') renderCatalogs();
    if (view === 'orders') renderOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  el.navButtons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  const sidebarAccount = $('#sidebar-account');
  if (sidebarAccount) sidebarAccount.addEventListener('click', () => setView('account'));

  el.topbarActions.addEventListener('click', (event) => {
    if (event.target.closest('[data-topnew]')) openEditor(null);
    if (event.target.closest('[data-savesettings]')) el.settingsForm.requestSubmit();
  });

  el.bannerChange.addEventListener('click', () => setView('account'));

  /* ---------------------------------------------------------------- *
   * Product list actions
   * ---------------------------------------------------------------- */

  el.rows.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const product = state.products.find((item) => item.id === edit.dataset.edit);
      if (product) openEditor(product);
      return;
    }

    const remove = event.target.closest('[data-delete]');
    if (remove) {
      const product = state.products.find((item) => item.id === remove.dataset.delete);
      if (!product) return;
      const confirmed = await confirmDialog({
        title: 'Delete this product?',
        text: `“${product.title}” will disappear from the storefront. The photos stay in the uploads folder.`,
        confirmLabel: 'Delete product'
      });
      if (!confirmed) return;
      try {
        await api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
        state.products = state.products.filter((item) => item.id !== product.id);
        renderAll();
        toast('Product deleted.');
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }

    if (event.target.closest('[data-new]')) openEditor(null);
  });

  el.rows.addEventListener('change', async (event) => {
    const toggle = event.target.closest('[data-toggle]');
    if (!toggle) return;
    const product = state.products.find((item) => item.id === toggle.dataset.toggle);
    if (!product) return;

    toggle.disabled = true;
    try {
      const result = await api(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        body: { ...product, active: toggle.checked }
      });
      const index = state.products.indexOf(product);
      state.products[index] = result.product;
      renderStats();
      renderRows();
      toast(toggle.checked ? 'Product is now live.' : 'Product hidden from the store.');
    } catch (error) {
      toggle.checked = !toggle.checked;
      toggle.disabled = false;
      toast(error.message, 'error');
    }
  });

  el.newProduct.addEventListener('click', () => openEditor(null));

  let searchTimer = null;
  el.adminSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = el.adminSearch.value;
      renderRows();
    }, 120);
  });

  /* ---------------------------------------------------------------- *
   * Product editor
   * ---------------------------------------------------------------- */

  function openEditor(product) {
    state.editing = product || null;
    state.images = product ? [...product.images] : [];
    el.productForm.reset();
    el.productError.hidden = true;
    renderCatalogOptions(product ? product.catalogId : (state.catalogs[0] ? state.catalogs[0].id : ''));

    const form = el.productForm.elements;
    el.editorTitle.textContent = product ? 'Edit product' : 'Add a product';
    el.editorEyebrow.textContent = product ? product.category || 'Product' : 'New piece';
    el.saveProduct.textContent = product ? 'Save changes' : 'Publish product';

    if (product) {
      form.title.value = product.title || '';
      if (product.catalogId) form.catalogId.value = product.catalogId;
      form.stockQty.value = Number(product.stockQty) || 0;
      form.tagline.value = product.tagline || '';
      form.price.value = product.price != null ? product.price : '';
      form.discountPrice.value = product.discountPrice != null ? product.discountPrice : '';
      form.description.value = product.description || '';
      form.howToUse.value = product.howToUse || '';
      form.howToOrder.value = product.howToOrder || '';
      form.tags.value = (product.tags || []).join(', ');
      form.active.checked = product.active !== false;
      form.featured.checked = Boolean(product.featured);
    } else {
      form.active.checked = true;
      form.featured.checked = false;
      form.stockQty.value = 10;
    }

    renderImages();
    updatePricePreview();
    el.editor.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.editor.classList.add('is-open'));
    el.drawerScrollTop = 0;
    $('#drawer-scroll').scrollTop = 0;
    setTimeout(() => form.title.focus(), 150);
  }

  function closeEditor() {
    if (el.editor.hidden) return;
    el.editor.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      el.editor.hidden = true;
      state.editing = null;
      state.images = [];
    }, 200);
  }

  el.editor.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-editor]') || event.target.classList.contains('drawer__backdrop')) {
      closeEditor();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!el.editor.hidden && !el.confirm.open) closeEditor();
    if (el.orderDrawer && !el.orderDrawer.hidden) closeOrder();
  });

  /* ---- images ---- */

  function renderImages() {
    const hasImages = state.images.length > 0;
    el.uploaderEmpty.hidden = hasImages;
    el.imageList.hidden = !hasImages;

    el.imageList.innerHTML = state.images.map((image, index) => `
      <figure class="image-tile ${index === 0 ? 'is-cover' : ''}">
        <img src="${escapeHtml(image)}" alt="">
        ${index === 0 ? '<figcaption class="image-tile__badge">Cover</figcaption>' : ''}
        <div class="image-tile__ops">
          ${index !== 0 ? `<button class="tile-btn" type="button" data-cover="${index}" aria-label="Use as cover">Make cover</button>` : ''}
          <button class="tile-btn tile-btn--danger" type="button" data-remove="${index}" aria-label="Remove photo">Remove</button>
        </div>
      </figure>`).join('') + `
      <button class="image-add" type="button" data-add-image aria-label="Add more photos">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        <span>Add photo</span>
      </button>`;
  }

  el.imageList.addEventListener('click', (event) => {
    const cover = event.target.closest('[data-cover]');
    if (cover) {
      const index = Number(cover.dataset.cover);
      const [image] = state.images.splice(index, 1);
      state.images.unshift(image);
      renderImages();
      return;
    }

    const remove = event.target.closest('[data-remove]');
    if (remove) {
      state.images.splice(Number(remove.dataset.remove), 1);
      renderImages();
      return;
    }

    if (event.target.closest('[data-add-image]')) el.imageInput.click();
  });

  el.imageDrop.addEventListener('click', (event) => {
    if (event.target.closest('button') || event.target.closest('.image-tile')) return;
    el.imageInput.click();
  });

  el.imageInput.addEventListener('change', () => {
    const files = [...el.imageInput.files];
    el.imageInput.value = '';
    if (files.length) uploadFiles(files);
  });

  ['dragenter', 'dragover'].forEach((type) => {
    el.imageDrop.addEventListener(type, (event) => {
      event.preventDefault();
      el.imageDrop.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach((type) => {
    el.imageDrop.addEventListener(type, (event) => {
      event.preventDefault();
      if (type === 'dragleave' && el.imageDrop.contains(event.relatedTarget)) return;
      el.imageDrop.classList.remove('is-dragging');
    });
  });

  el.imageDrop.addEventListener('drop', (event) => {
    const files = [...(event.dataTransfer ? event.dataTransfer.files : [])].filter((file) => file.type.startsWith('image/'));
    if (files.length) uploadFiles(files);
  });

  async function uploadFiles(files) {
    const room = 8 - state.images.length;
    if (room <= 0) {
      toast('You can add up to 8 photos per product.', 'error');
      return;
    }

    const queue = files.slice(0, room);
    if (files.length > room) toast('Only the first 8 photos were added.', 'error');

    state.uploading = true;
    el.uploadProgress.hidden = false;
    el.uploadProgress.textContent = `Uploading ${queue.length} photo${queue.length === 1 ? '' : 's'}…`;

    try {
      for (let index = 0; index < queue.length; index += 1) {
        const file = queue[index];
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
          toast(`“${file.name}” is not a supported image.`, 'error');
          continue;
        }
        if (file.size > 12 * 1024 * 1024) {
          toast(`“${file.name}” is larger than 12 MB.`, 'error');
          continue;
        }
        el.uploadProgress.textContent = `Uploading ${index + 1} of ${queue.length}…`;
        const data = await fileToDataUrl(file);
        const result = await api('/api/admin/upload', { method: 'POST', body: { data } });
        state.images.push(result.url);
        renderImages();
      }
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      state.uploading = false;
      el.uploadProgress.hidden = true;
    }
  }

  async function fileToDataUrl(file) {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (bitmap.close) bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.87);
  }

  /* ---- price preview ---- */

  function updatePricePreview() {
    const form = el.productForm.elements;
    const original = Number(form.price.value);
    const discounted = form.discountPrice.value === '' ? null : Number(form.discountPrice.value);
    const unit = currency();

    if (!Number.isFinite(original) || original <= 0) {
      el.pricePreview.textContent = 'Enter the original price to see what customers will pay.';
      el.pricePreview.className = 'price-preview';
      return;
    }

    if (discounted != null && Number.isFinite(discounted) && discounted > 0 && discounted < original) {
      const percent = Math.round((1 - discounted / original) * 100);
      el.pricePreview.innerHTML = `Customers see <strong>${escapeHtml(unit)} ${money(discounted)}</strong> — ${percent}% off <s>${escapeHtml(unit)} ${money(original)}</s>.`;
      el.pricePreview.className = 'price-preview is-discount';
    } else if (discounted != null && discounted >= original) {
      el.pricePreview.textContent = 'The discounted price must be lower than the original price.';
      el.pricePreview.className = 'price-preview is-error';
    } else {
      el.pricePreview.innerHTML = `Customers see <strong>${escapeHtml(unit)} ${money(original)}</strong>. Add a lower “after discount” price to show a saving.`;
      el.pricePreview.className = 'price-preview';
    }
  }

  el.productForm.addEventListener('input', (event) => {
    if (['price', 'discountPrice'].includes(event.target.name)) updatePricePreview();
  });

  /* ---- save product ---- */

  el.productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.productError.hidden = true;
    const form = el.productForm.elements;

    const title = form.title.value.trim();
    const price = form.price.value === '' ? NaN : Number(form.price.value);
    const discountPrice = form.discountPrice.value === '' ? null : Number(form.discountPrice.value);

    if (!title) return showProductError('Give the product a title.');
    if (!Number.isFinite(price) || price < 0) return showProductError('Enter a valid original price.');
    if (discountPrice != null && (!Number.isFinite(discountPrice) || discountPrice < 0)) {
      return showProductError('Enter a valid discounted price, or leave it empty.');
    }
    if (discountPrice != null && discountPrice >= price) {
      return showProductError('The discounted price must be lower than the original price.');
    }
    if (state.uploading) return showProductError('Wait for the photos to finish uploading.');

    const payload = {
      title,
      catalogId: form.catalogId.value,
      stockQty: form.stockQty.value,
      tagline: form.tagline.value,
      price,
      discountPrice,
      description: form.description.value,
      howToUse: form.howToUse.value,
      howToOrder: form.howToOrder.value,
      tags: form.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
      images: state.images,
      active: form.active.checked,
      featured: form.featured.checked
    };

    setBusy(el.saveProduct, true, 'Saving…');
    try {
      const url = state.editing
        ? `/api/admin/products/${encodeURIComponent(state.editing.id)}`
        : '/api/admin/products';
      const result = await api(url, {
        method: state.editing ? 'PUT' : 'POST',
        body: payload
      });

      if (state.editing) {
        const index = state.products.findIndex((product) => product.id === state.editing.id);
        if (index >= 0) state.products[index] = result.product;
      } else {
        state.products.unshift(result.product);
      }

      if (result.product.featured) {
        state.products.forEach((product) => {
          if (product.id !== result.product.id) product.featured = false;
        });
      }

      renderAll();
      closeEditor();
      toast(state.editing ? 'Changes saved.' : 'Product published.');
    } catch (error) {
      showProductError(error.message);
    } finally {
      setBusy(el.saveProduct, false, 'Saving…');
      el.saveProduct.textContent = state.editing ? 'Save changes' : 'Publish product';
    }
  });

  function showProductError(message) {
    el.productError.textContent = message;
    el.productError.hidden = false;
    el.productError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------------------------------------------------------- *
   * Settings
   * ---------------------------------------------------------------- */

  function renderCopyFields() {
    if (!el.copyFields) return;
    const copy = (state.settings && state.settings.copy) || {};
    el.copyFields.innerHTML = COPY_GROUPS.map((group) => `
      <details class="copy-group">
        <summary>${escapeHtml(group.title)} <span>${group.fields.length} fields</span></summary>
        <div class="copy-group__body">
          ${group.fields.map(([key, label, type = 'text', hint = '']) => {
            const value = copy[key] == null ? '' : String(copy[key]);
            const max = key === 'ticker' ? 1200 : 500;
            const control = type === 'textarea'
              ? `<textarea data-copy-key="${key}" rows="2" maxlength="${max}">${escapeHtml(value)}</textarea>`
              : `<input data-copy-key="${key}" type="text" maxlength="${max}" value="${escapeHtml(value)}">`;
            return `<label class="field ${type === 'textarea' ? 'field--wide' : ''}">
              <span class="field__label">${escapeHtml(label)}</span>
              ${control}
              ${hint ? `<span class="field-note">${escapeHtml(hint)}</span>` : ''}
            </label>`;
          }).join('')}
        </div>
      </details>`).join('');
  }

  function fillSettingsForm() {
    if (!state.settings) return;
    const form = el.settingsForm.elements;
    for (const key of ['storeName', 'tagline', 'intro', 'currency', 'location', 'instagram', 'whatsapp', 'phone', 'email', 'deliveryNote', 'customerNote', 'welcomeEyebrow', 'welcomeTitle', 'welcomeText']) {
      if (form[key]) form[key].value = state.settings[key] || '';
    }
    const height = Number(state.settings.logoHeight) || 42;
    if (el.logoHeight) el.logoHeight.value = String(height);
    if (el.logoSizeValue) el.logoSizeValue.textContent = `${height} px`;
    document.documentElement.style.setProperty('--logo-height', `${height}px`);
    if (form.logoPlate) form.logoPlate.checked = Boolean(state.settings.logoPlate);
    document.body.classList.toggle('has-logo-plate', Boolean(state.settings.logoPlate && state.settings.logo));
    renderSteps(state.settings.orderSteps || []);
    setLogoPreview(state.settings.logo || '');
    renderCopyFields();
  }

  function setLogoPreview(url) {
    state.logo = url || '';
    if (state.logo) {
      el.logoPreviewImg.src = state.logo;
      el.logoPreviewImg.hidden = false;
      el.logoEmpty.hidden = true;
      el.removeLogo.hidden = false;
    } else {
      el.logoPreviewImg.hidden = true;
      el.logoPreviewImg.removeAttribute('src');
      el.logoEmpty.hidden = false;
      el.removeLogo.hidden = true;
    }
  }

  if (el.logoHeight) {
    el.logoHeight.addEventListener('input', () => {
      const height = Number(el.logoHeight.value) || 42;
      document.documentElement.style.setProperty('--logo-height', `${height}px`);
      if (el.logoSizeValue) el.logoSizeValue.textContent = `${height} px`;
    });
  }

  el.uploadLogo.addEventListener('click', () => el.logoInput.click());

  el.removeLogo.addEventListener('click', () => {
    setLogoPreview('');
    toast('Logo removed — save your settings to apply it.');
  });

  el.logoInput.addEventListener('change', async () => {
    const file = el.logoInput.files && el.logoInput.files[0];
    el.logoInput.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.type)) {
      toast('Use a PNG, JPG, WebP or SVG image for the logo.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast('That logo is larger than 8 MB.', 'error');
      return;
    }

    setBusy(el.uploadLogo, true, 'Uploading…');
    try {
      const data = await logoToDataUrl(file);
      const result = await api('/api/admin/upload', { method: 'POST', body: { data } });
      setLogoPreview(result.url);
      toast('Logo uploaded — save your settings to apply it.');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(el.uploadLogo, false, 'Uploading…');
    }
  });

  async function logoToDataUrl(file) {
    const max = 600;

    // SVG logos are rasterised in the browser so the server only ever stores PNG.
    if (file.type === 'image/svg+xml') {
      const objectUrl = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const width = image.naturalWidth || 600;
        const height = image.naturalHeight || 200;
        const scale = Math.min(1, max / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (bitmap.close) bitmap.close();
    return canvas.toDataURL('image/png');
  }

  function renderSteps(steps) {
    el.stepEditor.innerHTML = steps.map((step, index) => `
      <div class="step-row" data-step>
        <span class="step-row__num">${String(index + 1).padStart(2, '0')}</span>
        <div class="step-row__fields">
          <input type="text" data-step-title maxlength="80" placeholder="Step title" value="${escapeHtml(step.title || '')}">
          <textarea rows="2" data-step-text maxlength="400" placeholder="What happens in this step?">${escapeHtml(step.text || '')}</textarea>
        </div>
        <button class="row-btn row-btn--danger" type="button" data-remove-step aria-label="Remove step">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>
        </button>
      </div>`).join('');
    el.addStep.disabled = steps.length >= 6;
  }

  el.addStep.addEventListener('click', () => {
    const current = [...$$('[data-step]', el.stepEditor)].map(readStep);
    if (current.length >= 6) return;
    renderSteps([...current, { title: '', text: '' }]);
    const rows = $$('[data-step]', el.stepEditor);
    const last = rows[rows.length - 1];
    if (last) $('[data-step-title]', last).focus();
  });

  el.stepEditor.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-step]');
    if (!remove) return;
    const rows = $$('[data-step]', el.stepEditor).map(readStep);
    const index = $$('[data-step]', el.stepEditor).indexOf(remove.closest('[data-step]'));
    rows.splice(index, 1);
    renderSteps(rows);
  });

  function readStep(row) {
    return {
      title: $('[data-step-title]', row).value,
      text: $('[data-step-text]', row).value
    };
  }

  el.settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = el.settingsForm.elements;
    const payload = {};
    for (const key of ['storeName', 'tagline', 'intro', 'currency', 'location', 'instagram', 'whatsapp', 'phone', 'email', 'deliveryNote', 'customerNote', 'welcomeEyebrow', 'welcomeTitle', 'welcomeText']) {
      payload[key] = form[key].value;
    }
    payload.logo = state.logo;
    payload.logoHeight = Number(el.logoHeight && el.logoHeight.value) || 42;
    payload.logoPlate = Boolean(form.logoPlate && form.logoPlate.checked);
    payload.copy = {};
    $$('[data-copy-key]', el.copyFields).forEach((input) => {
      payload.copy[input.dataset.copyKey] = input.value;
    });
    payload.orderSteps = $$('[data-step]', el.stepEditor).map(readStep).filter((step) => step.title.trim() || step.text.trim());

    if (!payload.storeName.trim()) {
      toast('The store needs a name.', 'error');
      form.storeName.focus();
      return;
    }

    const buttons = [el.saveSettings, el.topbarActions.querySelector('[data-savesettings]')].filter(Boolean);
    buttons.forEach((button) => setBusy(button, true, 'Saving…'));
    try {
      const result = await api('/api/admin/settings', { method: 'PUT', body: payload });
      state.settings = result.settings;
      applyBrand();
      fillSettingsForm();
      toast('Storefront settings saved.');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      buttons.forEach((button) => setBusy(button, false, 'Saving…'));
    }
  });

  /* ---------------------------------------------------------------- *
   * Password
   * ---------------------------------------------------------------- */

  el.passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.passwordError.hidden = true;
    const form = el.passwordForm.elements;
    const current = form.current.value;
    const next = form.next.value;
    const confirm = form.confirm.value;

    if (!current) return showPasswordError('Enter your current password.');
    if (next.length < 8) return showPasswordError('Use at least 8 characters for the new password.');
    if (next !== confirm) return showPasswordError('The two new passwords do not match.');

    const button = el.passwordForm.querySelector('button[type="submit"]');
    setBusy(button, true, 'Updating…');
    try {
      await api('/api/admin/password', { method: 'POST', body: { current, next } });
      el.passwordForm.reset();
      state.defaultPassword = false;
      el.banner.hidden = true;
      toast('Password updated. Use it next time you sign in.');
    } catch (error) {
      showPasswordError(error.message);
    } finally {
      setBusy(button, false, 'Updating…');
    }
  });

  $$('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      button.textContent = visible ? 'Show' : 'Hide';
    });
  });

  function showPasswordError(message) {
    el.passwordError.textContent = message;
    el.passwordError.hidden = false;
  }

  /* ---------------------------------------------------------------- *
   * Confirm dialog
   * ---------------------------------------------------------------- */

  function confirmDialog({ title, text, confirmLabel }) {
    return new Promise((resolve) => {
      el.confirmTitle.textContent = title;
      el.confirmText.textContent = text;
      el.confirmYes.textContent = confirmLabel || 'Confirm';
      el.confirm.returnValue = '';
      el.confirm.showModal();

      const onClose = () => {
        el.confirm.removeEventListener('close', onClose);
        resolve(el.confirm.returnValue === 'confirm');
      };
      el.confirm.addEventListener('close', onClose);
    });
  }

  $$('.js-brand-logo').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      $$('[data-brand-text]').forEach((node) => { node.hidden = false; });
    });
  });

  boot();
})();
