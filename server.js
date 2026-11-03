'use strict';

/**
 * Atelier — a small, dependency-free storefront + admin panel.
 * Run: node server.js   (then open http://127.0.0.1:3000)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const BUNDLED_UPLOAD_DIR = path.join(ROOT, 'uploads');
const BUNDLED_DATA_DIR = path.join(ROOT, 'data');
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, 'db.json');
const BUNDLED_SAMPLE_DIR = path.join(BUNDLED_UPLOAD_DIR, 'samples');

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : BUNDLED_DATA_DIR;
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : BUNDLED_UPLOAD_DIR;
const SAMPLE_DIR = path.join(UPLOAD_DIR, 'samples');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_JSON_BYTES = 1 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const LOGIN_WINDOW = 10 * 60 * 1000;
const LOGIN_MAX_TRIES = 8;

const MIN_ORDER_TOTAL = 250;
const SHIPPING_AREAS = {
  cairo: { label: 'Cairo & Giza', fee: 85 },
  alexandria: { label: 'Alexandria', fee: 90 }
};

const sessions = new Map();
const loginAttempts = new Map();

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

const DEFAULT_COPY = {
  navCollection: 'Collection',
  navHowToOrder: 'How to order',
  navContact: 'Contact',
  heroEyebrow: 'Small batch · {location}',
  heroPrimary: 'Browse the collection',
  heroSecondary: 'How to order',
  heroPoint1: 'Handmade in small batches',
  heroPoint2: 'Discounted studio prices',
  heroPoint3: 'Cash on delivery',
  heroTagLabel: 'Studio price',
  heroTagSave: 'Save {percent}%',
  ticker: 'Handmade in small batches\nCairo & Giza delivery\nCash on delivery\nStudio prices',
  collectionEyebrow: 'The collection',
  collectionTitle: 'Pieces currently in the studio',
  searchPlaceholder: 'Search pieces',
  sortLabel: 'Sort',
  sortNewest: 'Newest',
  sortPriceAsc: 'Price, low to high',
  sortPriceDesc: 'Price, high to low',
  sortDiscount: 'Biggest saving',
  allPieces: 'All pieces',
  greeting: 'Salam, {name}',
  emptyStudioTitle: 'The studio is restocking.',
  emptyStudioText: 'New pieces are being photographed. Check back soon, or message us to hear first.',
  emptySearchTitle: 'No pieces match that search.',
  emptySearchText: 'Try another word, or clear the filters to see the whole collection.',
  viewDetails: 'View details',
  addToCart: 'Add to cart',
  soldOut: 'Sold out',
  onlyLeft: 'Only {qty} left',
  inStock: 'In stock',
  available: '{qty} available',
  orderingEyebrow: 'Ordering',
  orderingTitle: 'Three small steps,\nthen it is on its way.',
  contactEyebrow: 'Talk to us',
  contactTitle: 'Questions before you order?',
  contactButton: 'Message on WhatsApp',
  footerShop: 'Shop',
  footerContact: 'Contact',
  footerStudio: 'Studio',
  footerHours: 'Sat–Thu, 11:00–19:00',
  footerTax: 'Prices in {currency}, inclusive of tax.',
  welcomeFormEyebrow: 'Private viewing',
  welcomeFormTitle: 'Welcome in',
  nameLabel: 'Your name',
  phoneLabel: 'Phone number',
  loginButton: 'Enter the store',
  loginFine: 'Your name and number are saved by the shop so they can confirm your order. No account, no password, no email required.',
  cartEyebrow: 'Your order',
  cartTitle: 'Cart',
  cartEmptyTitle: 'Your cart is empty',
  cartEmptyText: 'Add a few pieces from the collection and they will wait for you here.',
  cartEmptyButton: 'Browse the collection',
  cartItems: 'Items',
  cartComplete: 'Complete order',
  cartFine: 'Delivery is added at checkout. Minimum order EGP 250 before delivery.',
  cartRemove: 'Remove',
  cartEach: 'each',
  cartMax: 'Maximum {qty} available',
  cartAddMore: 'Add {amount} more to reach the {minimum} minimum.',
  cartMinReached: 'Minimum reached — delivery is added at checkout.',
  modalDescription: 'Description',
  modalHowToUse: 'How to use',
  modalHowToOrder: 'How to order',
  modalOrdering: 'How ordering works',
  detailSave: 'Save {percent}%',
  checkoutEyebrow: 'Checkout',
  checkoutTitle: 'Where should we send it?',
  checkoutLede: 'Add your details and choose your delivery area. Your summary is on the side.',
  checkoutDetailsHeading: 'Your details',
  checkoutAreaHeading: 'Delivery area',
  checkoutFirstName: 'First name',
  checkoutLastName: 'Last name',
  checkoutPhone: 'Phone number',
  checkoutWhatsapp: 'WhatsApp number',
  checkoutAddress: 'Full address',
  checkoutAddressNote: 'The courier will call you before arriving.',
  checkoutAreaNote: 'Choose the area where you live. Delivery takes 2–4 working days.',
  checkoutPayment: 'Cash on delivery',
  checkoutPaymentNote: 'Pay the courier when your order arrives.',
  checkoutSubmit: 'Complete order',
  checkoutFine: 'When you tap the button, your order summary opens in WhatsApp so you can send it to the shop.',
  checkoutSummary: 'Summary',
  checkoutOrderEyebrow: 'Your order',
  checkoutSuccessEyebrow: 'Order created',
  checkoutSuccessFine: 'If WhatsApp does not open automatically, tap the button above.',
  checkoutEmptyEyebrow: 'Nothing here yet',
  checkoutEmptyTitle: 'Your cart is empty.',
  checkoutEmptyText: 'Add a few pieces to your cart, then come back to complete the order.',
  checkoutEmptyButton: 'Browse the collection',
  checkoutGateEyebrow: 'One quick step',
  checkoutGateTitle: 'Enter the store first.',
  checkoutGateText: 'Your cart is saved. Enter your name and phone number on the welcome screen, then come back here to finish the order.',
  checkoutGateButton: 'Go to the welcome screen',
  checkoutItems: 'Items',
  checkoutDelivery: 'Delivery',
  checkoutTotal: 'Total',
  checkoutMinNote: 'Minimum order EGP 250 before delivery. Delivery is EGP 85 for Cairo & Giza and EGP 90 for Alexandria.',
  checkoutChooseArea: 'Choose area',
  checkoutSuccess: 'Opening WhatsApp…',
  checkoutSuccessNote: 'Your order summary is ready to send.',
  checkoutSuccessButton: 'Open WhatsApp'
};

const DEFAULT_SETTINGS = {
  storeName: 'Dew Skincare',
  tagline: 'Small-batch home and body goods, made slowly in Cairo.',
  location: 'Cairo, Egypt',
  intro:
    'Every piece is made in small batches, finished by hand and priced honestly. Browse the collection, open a piece to read how it is made and how to care for it, then send your order straight to us on WhatsApp.',
  currency: 'EGP',
  logo: '',
  logoHeight: 42,
  logoPlate: false,
  welcomeEyebrow: 'The collection',
  welcomeTitle: 'Made slowly,\nfor everyday\nrituals.',
  welcomeText: 'Small-batch home and body goods, made slowly in Cairo.',
  whatsapp: '+201000000000',
  phone: '+20 100 000 0000',
  email: 'hello@ateliernour.com',
  instagram: 'atelier.nour',
  deliveryNote: 'Delivery EGP 85 for Cairo & Giza and EGP 90 for Alexandria. Cash on delivery is available.',
  customerNote: 'No password needed — leave your name and number so we can confirm your order.',
  copy: { ...DEFAULT_COPY },
  orderSteps: [
    {
      title: 'Choose your pieces',
      text: 'Browse the catalogs and add anything you like to your cart — quantities are limited to the stock available.'
    },
    {
      title: 'Complete your order',
      text: 'Open the cart and tap Complete order. Add your name, address, phone and WhatsApp number, then choose Cairo & Giza or Alexandria.'
    },
    {
      title: 'Confirm on WhatsApp',
      text: 'Your order summary — number, quantities, prices, delivery and total — opens in WhatsApp so you can send it to us and confirm delivery.'
    }
  ]
};


const SAMPLE_PRODUCTS = [
  {
    title: 'Amber & Cedar Candle',
    category: 'Home fragrance',
    tagline: 'A 60-hour soy candle in a hand-poured amber glass jar.',
    description:
      'Warm amber, dry cedar and a trace of orange peel. Poured by hand in small batches into a reusable amber glass jar, with a cotton wick and a slow, even 60-hour burn. The label is letterpressed on cotton paper and every jar is finished with a brass lid.',
    howToUse:
      'Trim the wick to 5 mm before every burn. On the first burn, let the wax melt all the way to the edge of the jar (about 2 hours) so it burns evenly. Never burn for more than 4 hours at a time, keep away from draughts, and never leave a candle unattended.',
    howToOrder:
      'Tap “Order on WhatsApp”. We confirm stock the same day and deliver across Cairo and Giza in 2–4 working days. Cash on delivery, or pay by InstaPay in advance.',
    price: 620,
    discountPrice: 480,
    images: ['/uploads/samples/candle.svg'],
    tags: ['Hand-poured', '60 hour burn', 'Refillable jar'],
    stock: 'in',
    stockQty: 18,
    featured: true,
    active: true
  },
  {
    title: 'Stoneware Mug, Sand',
    category: 'Ceramics',
    tagline: 'Wheel-thrown stoneware with a speckled sand glaze. 300 ml.',
    description:
      'Thrown on the wheel from local stoneware clay, then fired twice at high temperature so it keeps heat and holds up to daily use. The speckled sand glaze is food-safe and every mug is slightly different, with a generous handle that fits a whole hand.',
    howToUse:
      'Dishwasher and microwave safe. To keep the glaze bright, avoid sudden temperature changes — let a hot mug cool before washing. Each piece is made by hand, so small variations in shape and speckle are part of the finish.',
    howToOrder:
      'Tap “Order on WhatsApp” and tell us how many you need — sets of 2 or 4 are wrapped together at no extra cost. Delivery in 2–4 working days, cash on delivery available.',
    price: 350,
    discountPrice: 280,
    images: ['/uploads/samples/mug.svg'],
    tags: ['Wheel-thrown', '300 ml', 'Dishwasher safe'],
    stock: 'in',
    stockQty: 12,
    featured: false,
    active: true
  },
  {
    title: 'Olive & Laurel Soap',
    category: 'Body',
    tagline: 'Cold-process soap with olive oil, laurel and a little clay.',
    description:
      'A slow-cured cold-process bar made with extra virgin olive oil, laurel berry oil and green clay. It lathers into a soft, dense foam and is gentle enough for hands, face and body. Cured for six weeks and cut by hand, so each bar weighs around 110 g.',
    howToUse:
      'Wet the bar and work it between your hands, then rinse. Keep it on a draining soap dish between uses so it lasts longer. For external use only; stop using if irritation occurs.',
    howToOrder:
      'Tap “Order on WhatsApp”. Single bars or a box of three — we will confirm the scent batch available that week. Delivery in 2–4 working days.',
    price: 140,
    discountPrice: 110,
    images: ['/uploads/samples/soap.svg'],
    tags: ['Cold-process', 'Olive oil', '110 g'],
    stock: 'low',
    stockQty: 5,
    featured: false,
    active: true
  },
  {
    title: 'Woven Linen Throw',
    category: 'Textiles',
    tagline: 'Stonewashed linen in warm sand, woven on a wooden loom.',
    description:
      'A generous 130 × 180 cm throw woven from long-staple linen on a wooden loom, then stonewashed twice so it arrives already soft. Warm sand with a hand-knotted fringe at both ends. It works as a light summer blanket, a sofa throw or a table cloth for long dinners.',
    howToUse:
      'Machine wash cold on a gentle cycle with a mild detergent. Do not bleach. Line dry or tumble on low, and it will soften further with every wash. Iron on medium while slightly damp if you prefer a crisp finish.',
    howToOrder:
      'Tap “Order on WhatsApp”. Each throw is woven to order in batches, so allow 2–4 working days for delivery in Cairo and Giza, and 5–7 days elsewhere in Egypt.',
    price: 1450,
    discountPrice: 1160,
    images: ['/uploads/samples/throw.svg'],
    tags: ['Pure linen', '130 × 180 cm', 'Stonewashed'],
    stock: 'in',
    stockQty: 3,
    featured: false,
    active: true
  }
];

function copyMissing(source, destination) {
  if (!fs.existsSync(source)) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyMissing(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOAD_DIR, SAMPLE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // On a host with persistent external folders, seed them from the bundled shop
  // on first start so the catalog, logo and sample images are not lost.
  if (DATA_DIR !== BUNDLED_DATA_DIR && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
    fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
  }
  if (UPLOAD_DIR !== BUNDLED_UPLOAD_DIR) {
    copyMissing(BUNDLED_UPLOAD_DIR, UPLOAD_DIR);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}


function stockState(quantity) {
  const count = Number(quantity);
  if (!Number.isFinite(count) || count <= 0) return 'out';
  if (count <= 3) return 'low';
  return 'in';
}

function stockQuantity(product) {
  const count = Number(product && product.stockQty);
  if (Number.isFinite(count) && count >= 0) return Math.floor(count);
  if (product && product.stock === 'out') return 0;
  if (product && product.stock === 'low') return 4;
  return 12;
}

function normalizeCatalogData(database) {
  let changed = false;
  if (!Array.isArray(database.catalogs)) {
    database.catalogs = [];
    changed = true;
  }

  database.catalogs.forEach((catalog, index) => {
    if (!catalog.id) {
      catalog.id = makeId();
      changed = true;
    }
    if (!catalog.name) {
      catalog.name = 'Collection';
      changed = true;
    }
    if (!Number.isFinite(Number(catalog.sort))) {
      catalog.sort = index;
      changed = true;
    }
    if (!catalog.createdAt) {
      catalog.createdAt = nowIso();
      changed = true;
    }
    if (typeof catalog.description !== 'string') {
      catalog.description = '';
      changed = true;
    }
  });

  for (const product of database.products) {
    let catalog = product.catalogId
      ? database.catalogs.find((entry) => entry.id === product.catalogId)
      : null;

    if (!catalog) {
      const name = text(product.category, 40) || 'Collection';
      catalog = database.catalogs.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
      if (!catalog) {
        catalog = {
          id: makeId(),
          name,
          description: '',
          sort: database.catalogs.length,
          createdAt: nowIso()
        };
        database.catalogs.push(catalog);
      }
      product.catalogId = catalog.id;
      changed = true;
    }

    if (product.category !== catalog.name) {
      product.category = catalog.name;
      changed = true;
    }

    const quantity = stockQuantity(product);
    if (product.stockQty !== quantity) {
      product.stockQty = quantity;
      changed = true;
    }
    const state = stockState(quantity);
    if (product.stock !== state) {
      product.stock = state;
      changed = true;
    }
  }

  return changed;
}

function normalizeOrders(database) {
  let changed = false;
  if (!Array.isArray(database.orders)) {
    database.orders = [];
    changed = true;
  }

  const needsRenumber = database.orders.some((order) => !/^DEW#\d+$/.test(String(order.number || '')));
  if (needsRenumber) {
    const ordered = [...database.orders].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    ordered.forEach((order, index) => {
      order.number = `DEW#${1000 + index}`;
      changed = true;
    });
    database.orderSeq = 1000 + ordered.length;
  }

  let maxNumber = 999;
  for (const order of database.orders) {
    const match = /^DEW#(\d+)$/.exec(String(order.number || ''));
    if (match) maxNumber = Math.max(maxNumber, Number(match[1]));

    for (const [field, fallback] of [['paid', false], ['shipped', false], ['delivered', false], ['tracking', ''], ['notes', '']]) {
      if (order[field] === undefined) {
        order[field] = fallback;
        changed = true;
      }
    }
    order.status = order.delivered ? 'delivered' : order.shipped ? 'shipped' : 'new';

    const name = `${order.customer && order.customer.firstName ? order.customer.firstName : ''} ${order.customer && order.customer.lastName ? order.customer.lastName : ''}`.trim();
    if (ensureCustomerIn(database, name, order.customer && order.customer.phone, order.createdAt)) changed = true;
  }

  const sequence = Number(database.orderSeq) || 0;
  if (sequence <= maxNumber) {
    database.orderSeq = maxNumber + 1;
    changed = true;
  }

  database.orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return changed;
}

function buildSeed() {
  const created = Date.now();
  const products = SAMPLE_PRODUCTS.map((product, index) => ({
    id: makeId(),
    ...product,
    createdAt: new Date(created - index * 86400000).toISOString(),
    updatedAt: new Date(created - index * 86400000).toISOString()
  }));

  const database = {
    version: 1,
    secret: crypto.randomBytes(32).toString('hex'),
    admin: { passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD), updatedAt: nowIso() },
    settings: { ...DEFAULT_SETTINGS, orderSteps: DEFAULT_SETTINGS.orderSteps.map((s) => ({ ...s })) },
    products,
    customers: [],
    catalogs: [],
    orders: [],
    orderSeq: 1000,
    createdAt: nowIso()
  };

  normalizeCatalogData(database);
  return database;
}

function writeDb(next) {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function loadDb() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const seed = buildSeed();
    writeDb(seed);
    return seed;
  }

  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let dirty = false;

    if (!db.admin || !db.admin.passwordHash) {
      db.admin = { passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD), updatedAt: nowIso() };
      dirty = true;
    }
    if (!db.secret) {
      db.secret = crypto.randomBytes(32).toString('hex');
      dirty = true;
    }
    db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
    db.settings.copy = { ...DEFAULT_COPY, ...(db.settings.copy || {}) };
    db.products = Array.isArray(db.products) ? db.products : [];
    db.customers = Array.isArray(db.customers) ? db.customers : [];
    db.orders = Array.isArray(db.orders) ? db.orders : [];
    if (!Number.isFinite(Number(db.orderSeq))) db.orderSeq = 1000 + db.orders.length;
    if (normalizeCatalogData(db)) dirty = true;
    if (normalizeOrders(db)) dirty = true;

    if (dirty) writeDb(db);
    return db;
  } catch (err) {
    const backup = `${DB_FILE}.corrupt-${Date.now()}`;
    try {
      fs.copyFileSync(DB_FILE, backup);
    } catch {
      /* ignore */
    }
    console.error(`Could not read db.json (${err.message}). A backup was saved to ${backup}. Starting fresh.`);
    const seed = buildSeed();
    writeDb(seed);
    return seed;
  }
}

const db = loadDb();
let usingDefaultPassword = verifyPassword('admin123', db.admin.passwordHash);

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(body);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

function isSecureRequest(req) {
  if (req.socket && req.socket.encrypted) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return proto === 'https';
}

function sessionCookie(req, token, maxAgeSeconds) {
  const bits = [
    `sid=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isSecureRequest(req)) bits.push('Secure');
  return bits.join('; ');
}

function currentSession(req) {
  const token = parseCookies(req).sid;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL;
  return { ...session, token };
}

function createSession(req, data) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { ...data, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL });
  return { token, cookie: sessionCookie(req, token, Math.floor(SESSION_TTL / 1000)) };
}

function ensureCustomerIn(database, name, phone, when) {
  const digits = String(phone || '').replace(/\D/g, '').slice(0, 20);
  if (!digits) return false;
  const existing = database.customers.find((customer) => customer.phoneDigits === digits);
  let changed = false;
  if (existing) {
    if (name && existing.name !== name) {
      existing.name = name;
      changed = true;
    }
    if (existing.phone !== phone) {
      existing.phone = phone;
      changed = true;
    }
    const stamp = when ? Date.parse(when) : Date.now();
    const last = Date.parse(existing.lastSeen || 0);
    if (!Number.isFinite(last) || stamp > last) {
      existing.lastSeen = when || nowIso();
      changed = true;
    }
    const first = Date.parse(existing.firstSeen || 0);
    if (!Number.isFinite(first) || stamp < first) {
      existing.firstSeen = when || existing.lastSeen;
      changed = true;
    }
    return changed;
  }
  database.customers.unshift({
    id: makeId(),
    name: name || 'Customer',
    phone,
    phoneDigits: digits,
    visits: 1,
    firstSeen: when || nowIso(),
    lastSeen: when || nowIso()
  });
  database.customers = database.customers.slice(0, 5000);
  return true;
}

function recordCustomer(name, phone) {
  const digits = String(phone).replace(/\D/g, '').slice(0, 20);
  const now = nowIso();
  const existing = db.customers.find((customer) => customer.phoneDigits === digits);
  if (existing) {
    existing.name = name;
    existing.phone = phone;
    existing.lastSeen = now;
    existing.visits = (Number(existing.visits) || 0) + 1;
  } else {
    db.customers.unshift({
      id: makeId(),
      name,
      phone,
      phoneDigits: digits,
      visits: 1,
      firstSeen: now,
      lastSeen: now
    });
    db.customers = db.customers.slice(0, 5000);
  }
  writeDb(db);
}

function sessionProfile(session) {
  if (!session) return null;
  if (session.role === 'admin') return { role: 'admin', name: 'Store admin' };
  return { role: 'customer', name: session.name || 'Guest', phone: session.phone || '' };
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'That request is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

async function readJson(req, limit = MAX_JSON_BYTES) {
  const raw = await readBody(req, limit);
  if (!raw.length) return {};
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch {
    throw new HttpError(400, 'We could not read that request.');
  }
}

function requireAdmin(session) {
  if (!session || session.role !== 'admin') throw new HttpError(401, 'Sign in as the store admin first.');
}

function requireShopper(session) {
  if (!session) throw new HttpError(401, 'Please sign in to view the collection.');
}

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function money(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : fallback;
}

function safeImageUrl(value) {
  const url = typeof value === 'string' ? value.trim() : '';
  if (/^\/uploads\/[A-Za-z0-9._/-]+$/.test(url) && !url.includes('..')) return url;
  if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url;
  return null;
}

function sanitizeProduct(input, existing = null) {
  const title = text(input.title, 120);
  if (!title) throw new HttpError(400, 'Give the product a title.');

  const price = money(input.price, NaN);
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'Enter a valid original price.');

  let discountPrice = null;
  if (input.discountPrice !== null && input.discountPrice !== undefined && String(input.discountPrice).trim() !== '') {
    discountPrice = money(input.discountPrice, NaN);
    if (!Number.isFinite(discountPrice) || discountPrice < 0) {
      throw new HttpError(400, 'Enter a valid discounted price, or leave it empty.');
    }
    if (discountPrice >= price) {
      throw new HttpError(400, 'The discounted price must be lower than the original price.');
    }
  }

  const images = Array.isArray(input.images)
    ? input.images.map(safeImageUrl).filter(Boolean).slice(0, 8)
    : [];

  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((t) => text(t, 30)).filter(Boolean))].slice(0, 6)
    : [];

  let stockQty;
  if (input.stockQty !== undefined && input.stockQty !== null && String(input.stockQty).trim() !== '') {
    stockQty = Math.floor(Number(input.stockQty));
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      throw new HttpError(400, 'Enter the quantity in stock as a whole number (0 for sold out).');
    }
    stockQty = Math.min(stockQty, 99999);
  } else {
    stockQty = existing ? stockQuantity(existing) : 10;
  }

  let catalog = null;
  const requestedCatalogId = text(input.catalogId, 64);
  if (requestedCatalogId) {
    catalog = db.catalogs.find((entry) => entry.id === requestedCatalogId) || null;
    if (!catalog) throw new HttpError(400, 'That catalog no longer exists.');
  }
  if (!catalog && existing && existing.catalogId) {
    catalog = db.catalogs.find((entry) => entry.id === existing.catalogId) || null;
  }
  if (!catalog) {
    const categoryName = text(input.category, 40).toLowerCase();
    catalog = db.catalogs.find((entry) => entry.name.toLowerCase() === categoryName) || null;
  }
  if (!catalog && db.catalogs.length) catalog = db.catalogs[0];

  return {
    id: existing ? existing.id : makeId(),
    title,
    catalogId: catalog ? catalog.id : '',
    category: catalog ? catalog.name : text(input.category, 40) || 'Collection',
    tagline: text(input.tagline, 160),
    description: text(input.description, 4000),
    howToUse: text(input.howToUse, 3000),
    howToOrder: text(input.howToOrder, 3000),
    price,
    discountPrice,
    images,
    tags,
    stockQty,
    stock: stockState(stockQty),
    featured: Boolean(input.featured),
    active: input.active === undefined ? true : Boolean(input.active),
    createdAt: existing ? existing.createdAt : nowIso(),
    updatedAt: nowIso()
  };
}

function sanitizeSettings(input) {
  const next = { ...db.settings };
  const stringFields = [
    ['storeName', 60],
    ['tagline', 160],
    ['location', 80],
    ['intro', 900],
    ['currency', 8],
    ['whatsapp', 30],
    ['phone', 40],
    ['email', 120],
    ['instagram', 60],
    ['deliveryNote', 400],
    ['customerNote', 240],
    ['welcomeEyebrow', 40],
    ['welcomeTitle', 200],
    ['welcomeText', 300]
  ];

  for (const [field, max] of stringFields) {
    if (input[field] !== undefined) next[field] = text(input[field], max);
  }

  if (!next.storeName) next.storeName = DEFAULT_SETTINGS.storeName;
  if (!next.currency) next.currency = 'EGP';

  if (input.logo !== undefined) {
    next.logo = input.logo ? safeImageUrl(input.logo) || '' : '';
  }

  if (input.logoHeight !== undefined) {
    const height = Math.round(Number(input.logoHeight));
    next.logoHeight = Number.isFinite(height) ? Math.min(80, Math.max(24, height)) : 42;
  }

  if (input.logoPlate !== undefined) {
    next.logoPlate = Boolean(input.logoPlate);
  }

  if (input.copy && typeof input.copy === 'object' && !Array.isArray(input.copy)) {
    const copy = { ...(next.copy || DEFAULT_COPY) };
    for (const key of Object.keys(DEFAULT_COPY)) {
      if (Object.prototype.hasOwnProperty.call(input.copy, key)) {
        copy[key] = text(input.copy[key], key === 'ticker' ? 1200 : 500);
      }
    }
    next.copy = copy;
  }

  if (Array.isArray(input.orderSteps)) {
    next.orderSteps = input.orderSteps
      .slice(0, 6)
      .map((step) => ({
        title: text(step && step.title, 80),
        text: text(step && step.text, 400)
      }))
      .filter((step) => step.title || step.text);
  }

  return next;
}

function publicProduct(product) {
  return {
    id: product.id,
    title: product.title,
    category: product.category,
    tagline: product.tagline,
    description: product.description,
    howToUse: product.howToUse,
    howToOrder: product.howToOrder,
    price: product.price,
    discountPrice: product.discountPrice,
    images: product.images,
    tags: product.tags,
    catalogId: product.catalogId || '',
    stockQty: stockQuantity(product),
    stock: stockState(stockQuantity(product)),
    featured: product.featured,
    updatedAt: product.updatedAt
  };
}

function publicSettings() {
  const s = db.settings;
  return {
    storeName: s.storeName,
    tagline: s.tagline,
    location: s.location,
    logo: s.logo || '',
    logoHeight: s.logoHeight || 42,
    logoPlate: Boolean(s.logoPlate),
    welcomeEyebrow: s.welcomeEyebrow || 'The collection',
    welcomeTitle: s.welcomeTitle || DEFAULT_SETTINGS.welcomeTitle,
    welcomeText: s.welcomeText || s.tagline,
    copy: { ...DEFAULT_COPY, ...(s.copy || {}) },
    intro: s.intro,
    currency: s.currency,
    whatsapp: s.whatsapp,
    phone: s.phone,
    email: s.email,
    instagram: s.instagram,
    deliveryNote: s.deliveryNote,
    customerNote: s.customerNote,
    orderSteps: s.orderSteps
  };
}

/* ------------------------------------------------------------------ *
 * Static files
 * ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function serveStatic(req, res, pathname, isUpload) {
  let relative;
  try {
    relative = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (relative === '/') relative = '/index.html';
  if (relative === '/admin') relative = '/admin.html';

  const base = isUpload ? UPLOAD_DIR : PUBLIC_DIR;
  const filePath = path.normalize(path.join(base, relative));

  if (filePath !== base && !filePath.startsWith(base + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    stat = null;
  }

  if (!stat || !stat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Content-Length': stat.size,
    'X-Content-Type-Options': 'nosniff'
  };

  if (ext === '.html') {
    headers['Cache-Control'] = 'no-cache';
    headers['Content-Security-Policy'] =
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
  } else if (isUpload) {
    headers['Cache-Control'] = 'public, max-age=604800';
  } else {
    headers['Cache-Control'] = 'no-cache';
  }

  res.writeHead(200, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath)
    .on('error', () => res.end())
    .pipe(res);
}

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */

function loginAllowed(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW });
    return true;
  }
  if (record.count >= LOGIN_MAX_TRIES) return false;
  record.count += 1;
  return true;
}

function clearLoginAttempts(req) {
  loginAttempts.delete(req.socket.remoteAddress || 'unknown');
}

async function uploadImage(req) {
  const body = await readJson(req, MAX_UPLOAD_BYTES);
  const dataUrl = typeof body.data === 'string' ? body.data : '';
  const match = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new HttpError(400, 'Upload a JPG, PNG, WebP or GIF image.');

  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) throw new HttpError(400, 'That image file is empty.');
  if (buffer.length > 8 * 1024 * 1024) throw new HttpError(413, 'Please use an image under 8 MB.');

  const ext = mime === 'jpeg' || mime === 'jpg' ? 'jpg' : mime;
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}`, bytes: buffer.length };
}


function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function displayMoney(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function publicCatalogs() {
  return db.catalogs.map(({ id, name, description }) => ({ id, name, description }));
}

function catalogsWithCounts() {
  return db.catalogs.map((catalog) => ({
    ...catalog,
    productCount: db.products.filter((product) => product.catalogId === catalog.id).length
  }));
}

function checkoutConfig() {
  return {
    currency: db.settings.currency,
    minimumOrder: MIN_ORDER_TOTAL,
    shipping: Object.entries(SHIPPING_AREAS).map(([id, area]) => ({ id, label: area.label, fee: area.fee }))
  };
}

function buildOrderMessage(order) {
  const currency = order.currency;
  const itemLines = order.items
    .map((item) => `• ${item.qty} × ${item.title} — ${currency} ${displayMoney(item.unitPrice)} each — ${currency} ${displayMoney(item.lineTotal)}`)
    .join('\n');

  return [
    `Hello ${db.settings.storeName},`,
    '',
    `I would like to confirm order ${order.number}.`,
    '',
    itemLines,
    '',
    `Items: ${currency} ${displayMoney(order.subtotal)}`,
    `Delivery (${order.customer.cityLabel}): ${currency} ${displayMoney(order.shipping)}`,
    `Order total: ${currency} ${displayMoney(order.total)}`,
    'Payment: Cash on delivery',
    '',
    `Name: ${order.customer.firstName} ${order.customer.lastName}`,
    `Phone: ${order.customer.phone}`,
    `WhatsApp: ${order.customer.whatsapp}`,
    `Address: ${order.customer.address}`,
    `Area: ${order.customer.cityLabel}`,
    '',
    'Thank you!'
  ].join('\n');
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const method = req.method;
  const session = currentSession(req);

  /* ---- public config ---- */
  if (pathname === '/api/config' && method === 'GET') {
    return sendJson(res, 200, {
      settings: publicSettings(),
      adminConfigured: true,
      defaultPasswordHint: usingDefaultPassword
    });
  }

  /* ---- who am I ---- */
  if (pathname === '/api/me' && method === 'GET') {
    return sendJson(res, 200, { session: sessionProfile(session) });
  }

  /* ---- customer sign in (no password) ---- */
  if (pathname === '/api/customer/login' && method === 'POST') {
    const body = await readJson(req, 16 * 1024);
    const name = text(body.name, 60);
    const phone = text(body.phone, 40);
    const phoneDigits = phone.replace(/\D/g, '');
    if (!name) throw new HttpError(400, 'Tell us your name so we know who is browsing.');
    if (phoneDigits.length < 7 || phoneDigits.length > 20) {
      throw new HttpError(400, 'Add a phone number so we can confirm your order.');
    }
    recordCustomer(name, phone);
    const { token, cookie } = createSession(req, { role: 'customer', name, phone });
    return sendJson(res, 200, { session: { role: 'customer', name, phone } }, { 'Set-Cookie': cookie });
  }

  /* ---- admin sign in ---- */
  if (pathname === '/api/admin/login' && method === 'POST') {
    if (!loginAllowed(req)) {
      throw new HttpError(429, 'Too many attempts. Wait a few minutes and try again.');
    }
    const body = await readJson(req, 16 * 1024);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!verifyPassword(password, db.admin.passwordHash)) {
      throw new HttpError(401, 'That password is not right. Try again.');
    }
    clearLoginAttempts(req);
    const { token, cookie } = createSession(req, { role: 'admin' });
    return sendJson(res, 200, { session: { role: 'admin', name: 'Store admin' } }, { 'Set-Cookie': cookie });
  }

  /* ---- sign out ---- */
  if (pathname === '/api/logout' && method === 'POST') {
    if (session) sessions.delete(session.token);
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' });
  }

  /* ---- products for shoppers (and admin preview) ---- */
  if (pathname === '/api/products' && method === 'GET') {
    requireShopper(session);
    const includeHidden = session.role === 'admin' && url.searchParams.get('all') === '1';
    const products = db.products
      .filter((product) => includeHidden || product.active)
      .map((product) => (includeHidden ? product : publicProduct(product)));
    return sendJson(res, 200, {
      products,
      catalogs: publicCatalogs(),
      ...checkoutConfig()
    });
  }


  /* ---- place an order ---- */
  if (pathname === '/api/orders' && method === 'POST') {
    requireShopper(session);
    const body = await readJson(req, 64 * 1024);
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) throw new HttpError(400, 'Your cart is empty.');
    if (rawItems.length > 40) throw new HttpError(400, 'That is too many different pieces in one order.');

    const merged = new Map();
    for (const item of rawItems) {
      const id = text(item && item.id, 80);
      const qty = Math.floor(Number(item && item.qty));
      if (!id || !Number.isFinite(qty) || qty < 1) {
        throw new HttpError(400, 'One of the quantities in your cart is not valid.');
      }
      merged.set(id, (merged.get(id) || 0) + qty);
    }
    if (merged.size > 25) throw new HttpError(400, 'That is too many different pieces in one order.');

    const lines = [];
    for (const [id, qty] of merged) {
      const product = db.products.find((item) => item.id === id);
      if (!product || !product.active) {
        throw new HttpError(400, 'One of the pieces in your cart is no longer available. Please check your cart again.');
      }
      const available = stockQuantity(product);
      if (available <= 0) {
        throw new HttpError(409, `“${product.title}” is sold out. Please remove it from your cart.`);
      }
      if (qty > available) {
        throw new HttpError(409, `Only ${available} of “${product.title}” left in stock. Please lower the quantity.`);
      }
      const unitPrice = product.discountPrice != null && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;
      lines.push({
        product,
        qty,
        unitPrice,
        lineTotal: roundMoney(unitPrice * qty)
      });
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    if (subtotal < MIN_ORDER_TOTAL) {
      throw new HttpError(400, `The minimum order is ${db.settings.currency} ${MIN_ORDER_TOTAL} before delivery. Add a little more to your cart.`);
    }

    const city = text(body.city, 30).toLowerCase();
    const area = SHIPPING_AREAS[city];
    if (!area) throw new HttpError(400, 'Choose Cairo & Giza or Alexandria for delivery.');

    const firstName = text(body.firstName, 60);
    const lastName = text(body.lastName, 60);
    const address = text(body.address, 500);
    const phone = text(body.phone, 40);
    const whatsapp = text(body.whatsapp, 40);

    if (!firstName) throw new HttpError(400, 'Enter your first name.');
    if (!lastName) throw new HttpError(400, 'Enter your last name.');
    if (address.length < 8) throw new HttpError(400, 'Enter your full address so the courier can find you.');
    if (phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'Enter a valid phone number.');
    if (whatsapp.replace(/\D/g, '').length < 7) throw new HttpError(400, 'Enter a valid WhatsApp number.');

    const shopDigits = String(db.settings.whatsapp || '').replace(/\D/g, '');
    if (!shopDigits) {
      throw new HttpError(400, 'The shop has not set a WhatsApp number yet, so orders cannot be sent. Please contact the shop directly.');
    }

    const shipping = area.fee;
    const total = roundMoney(subtotal + shipping);

    for (const line of lines) {
      line.product.stockQty = stockQuantity(line.product) - line.qty;
      line.product.stock = stockState(line.product.stockQty);
      line.product.updatedAt = nowIso();
    }

    const orderSequence = Number(db.orderSeq) || 1000;
    db.orderSeq = orderSequence + 1;
    const order = {
      id: makeId(),
      number: `DEW#${orderSequence}`,
      status: 'new',
      paid: false,
      shipped: false,
      delivered: false,
      tracking: '',
      notes: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      currency: db.settings.currency,
      customer: {
        firstName,
        lastName,
        phone,
        whatsapp,
        address,
        city,
        cityLabel: area.label
      },
      items: lines.map((line) => ({
        productId: line.product.id,
        title: line.product.title,
        catalog: line.product.category,
        image: (line.product.images && line.product.images[0]) || '',
        qty: line.qty,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal
      })),
      subtotal,
      shipping,
      total
    };

    ensureCustomerIn(db, `${firstName} ${lastName}`, phone, order.createdAt);
    db.orders.unshift(order);
    db.orders = db.orders.slice(0, 2000);
    writeDb(db);

    const message = buildOrderMessage(order);
    return sendJson(res, 201, {
      order,
      whatsappUrl: `https://wa.me/${shopDigits}?text=${encodeURIComponent(message)}`
    });
  }

  /* ---- admin: products ---- */
  if (pathname === '/api/admin/products' && method === 'GET') {
    requireAdmin(session);
    return sendJson(res, 200, {
      products: db.products,
      catalogs: catalogsWithCounts(),
      ...checkoutConfig()
    });
  }

  if (pathname === '/api/admin/products' && method === 'POST') {
    requireAdmin(session);
    const body = await readJson(req);
    const product = sanitizeProduct(body);
    if (product.featured) {
      for (const item of db.products) item.featured = false;
    }
    db.products.unshift(product);
    writeDb(db);
    return sendJson(res, 201, { product });
  }

  const productMatch = pathname.match(/^\/api\/admin\/products\/([A-Za-z0-9-]+)$/);
  if (productMatch) {
    requireAdmin(session);
    const product = db.products.find((item) => item.id === productMatch[1]);
    if (!product) throw new HttpError(404, 'That product no longer exists.');

    if (method === 'PUT') {
      const body = await readJson(req);
      const updated = sanitizeProduct({ ...product, ...body }, product);
      if (updated.featured) {
        for (const item of db.products) {
          if (item.id !== updated.id) item.featured = false;
        }
      }
      const index = db.products.indexOf(product);
      db.products[index] = updated;
      writeDb(db);
      return sendJson(res, 200, { product: updated });
    }

    if (method === 'DELETE') {
      db.products.splice(db.products.indexOf(product), 1);
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }
  }


  /* ---- admin: catalogs ---- */
  if (pathname === '/api/admin/catalogs' && method === 'GET') {
    requireAdmin(session);
    return sendJson(res, 200, { catalogs: catalogsWithCounts() });
  }

  if (pathname === '/api/admin/catalogs' && method === 'POST') {
    requireAdmin(session);
    const body = await readJson(req, 16 * 1024);
    const name = text(body.name, 40);
    if (!name) throw new HttpError(400, 'Give the catalog a name.');
    if (db.catalogs.some((catalog) => catalog.name.toLowerCase() === name.toLowerCase())) {
      throw new HttpError(409, 'A catalog with that name already exists.');
    }
    const catalog = {
      id: makeId(),
      name,
      description: text(body.description, 300),
      sort: db.catalogs.length,
      createdAt: nowIso()
    };
    db.catalogs.push(catalog);
    writeDb(db);
    return sendJson(res, 201, { catalog, catalogs: catalogsWithCounts() });
  }

  const catalogMatch = pathname.match(/^\/api\/admin\/catalogs\/([A-Za-z0-9-]+)$/);
  if (catalogMatch) {
    requireAdmin(session);
    const catalog = db.catalogs.find((entry) => entry.id === catalogMatch[1]);
    if (!catalog) throw new HttpError(404, 'That catalog no longer exists.');

    if (method === 'PUT') {
      const body = await readJson(req, 16 * 1024);
      const name = text(body.name, 40) || catalog.name;
      if (db.catalogs.some((entry) => entry.id !== catalog.id && entry.name.toLowerCase() === name.toLowerCase())) {
        throw new HttpError(409, 'A catalog with that name already exists.');
      }
      catalog.name = name;
      catalog.description = text(body.description, 300);
      for (const product of db.products) {
        if (product.catalogId === catalog.id) product.category = catalog.name;
      }
      writeDb(db);
      return sendJson(res, 200, { catalog, catalogs: catalogsWithCounts() });
    }

    if (method === 'DELETE') {
      const count = db.products.filter((product) => product.catalogId === catalog.id).length;
      if (count > 0) {
        throw new HttpError(409, `Move or delete the ${count} piece${count === 1 ? '' : 's'} in this catalog first.`);
      }
      db.catalogs.splice(db.catalogs.indexOf(catalog), 1);
      writeDb(db);
      return sendJson(res, 200, { catalogs: catalogsWithCounts() });
    }
  }

  /* ---- admin: image upload ---- */
  if (pathname === '/api/admin/upload' && method === 'POST') {
    requireAdmin(session);
    return sendJson(res, 201, await uploadImage(req));
  }

  /* ---- admin: customers ---- */
  if (pathname === '/api/admin/customers' && method === 'GET') {
    requireAdmin(session);
    const customers = [...db.customers].sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
    return sendJson(res, 200, { customers });
  }

  const customerMatch = pathname.match(/^\/api\/admin\/customers\/([A-Za-z0-9-]+)$/);
  if (customerMatch && method === 'DELETE') {
    requireAdmin(session);
    const index = db.customers.findIndex((customer) => customer.id === customerMatch[1]);
    if (index < 0) throw new HttpError(404, 'That customer no longer exists.');
    db.customers.splice(index, 1);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }


  /* ---- admin: orders ---- */
  if (pathname === '/api/admin/orders' && method === 'GET') {
    requireAdmin(session);
    return sendJson(res, 200, { orders: db.orders.slice(0, 500) });
  }

  const orderMatch = pathname.match(/^\/api\/admin\/orders\/([A-Za-z0-9-]+)$/);
  if (orderMatch && method === 'PUT') {
    requireAdmin(session);
    const order = db.orders.find((entry) => entry.id === orderMatch[1]);
    if (!order) throw new HttpError(404, 'That order no longer exists.');
    const body = await readJson(req, 32 * 1024);

    order.paid = Boolean(body.paid);
    order.shipped = Boolean(body.shipped);
    order.delivered = Boolean(body.delivered);
    order.tracking = text(body.tracking, 100);
    order.notes = text(body.notes, 1000);
    order.status = order.delivered ? 'delivered' : order.shipped ? 'shipped' : 'new';
    order.updatedAt = nowIso();

    writeDb(db);
    return sendJson(res, 200, { order });
  }

  if (orderMatch && method === 'DELETE') {
    requireAdmin(session);
    const index = db.orders.findIndex((entry) => entry.id === orderMatch[1]);
    if (index < 0) throw new HttpError(404, 'That order no longer exists.');
    db.orders.splice(index, 1);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  /* ---- admin: store settings ---- */
  if (pathname === '/api/admin/settings' && method === 'GET') {
    requireAdmin(session);
    return sendJson(res, 200, { settings: db.settings });
  }

  if (pathname === '/api/admin/settings' && method === 'PUT') {
    requireAdmin(session);
    const body = await readJson(req);
    db.settings = sanitizeSettings(body);
    writeDb(db);
    return sendJson(res, 200, { settings: db.settings });
  }

  /* ---- admin: password ---- */
  if (pathname === '/api/admin/password' && method === 'POST') {
    requireAdmin(session);
    const body = await readJson(req, 16 * 1024);
    const current = typeof body.current === 'string' ? body.current : '';
    const next = typeof body.next === 'string' ? body.next : '';

    if (!verifyPassword(current, db.admin.passwordHash)) {
      throw new HttpError(400, 'Your current password is not right.');
    }
    if (next.length < 8) throw new HttpError(400, 'Use at least 8 characters for the new password.');
    if (next.length > 200) throw new HttpError(400, 'That password is too long.');

    db.admin = { passwordHash: hashPassword(next), updatedAt: nowIso() };
    usingDefaultPassword = verifyPassword('admin123', db.admin.passwordHash);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  throw new HttpError(404, 'Not found.');
}

/* ------------------------------------------------------------------ *
 * Server
 * ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch((err) => {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      if (res.headersSent) {
        res.end();
        return;
      }
      sendJson(res, status, {
        error: status >= 500 ? 'Something went wrong on the server.' : err.message
      });
    });
    return;
  }

  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
      return;
    }

    const isUpload = url.pathname.startsWith('/uploads/');
    serveStatic(req, res, isUpload ? url.pathname.replace(/^\/uploads/, '') : url.pathname, isUpload);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Something went wrong.');
    } else {
      res.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log(`  ${db.settings.storeName}`);
  console.log(`  Storefront  http://${HOST}:${PORT}/`);
  console.log(`  Admin       http://${HOST}:${PORT}/admin`);
  if (usingDefaultPassword) {
    console.log('  Admin password: admin123  (change it under Account, or set ADMIN_PASSWORD)');
  }
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\nBye.');
  process.exit(0);
});
