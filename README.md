# Dew Skincare — storefront, cart & admin dashboard

A complete small shop with no build step, no database server and no npm packages:

- **Storefront** (`/`) — customers enter their name and phone number, browse your catalogs and add pieces to a cart.
- **Checkout** (`/checkout.html`) — name, address, phone, WhatsApp number, Cairo/Giza or Alexandria delivery, an itemised summary and the EGP 250 minimum.
- **Admin dashboard** (`/admin.html`) — password-protected: products, stock quantities, photos, both prices, catalogs, customers, welcome screen, logo and settings.

Built with dark green, black, red and blush pink. Node.js 18+ is the only requirement.

![Storefront](docs/storefront.jpg)
*The black header, deep green hero and pink catalog accents.*

![Cart](docs/cart.jpg)
*The cart drawer: quantities limited by stock, live subtotal and the minimum-order check.*

![Checkout](docs/checkout.jpg)
*Checkout with the order summary, delivery area and EGP 85 / EGP 90 delivery fees.*

![Dashboard](docs/dashboard.jpg)
*Products with stock quantities, discounts and visibility controls.*

![Catalogs](docs/catalogs.jpg)
*Catalogs such as Body care and Makeup, each with its own products.*

![Orders](docs/orders.jpg)
*Every completed order with its DEW# number, customer, delivery area and status.*

![Storefront text](docs/content.jpg)
*The Storefront text editor — every heading, label, button and scrolling-bar line.*

---

## Quick start

From this folder:

```bash
node server.js
```

Open:

- Storefront: http://127.0.0.1:3000/
- Admin: http://127.0.0.1:3000/admin.html

**Starting admin password: `admin123`** — change it under **Account** immediately.

Or use npm: `npm start`.

> The demo shop is branded **Dew Skincare**, with four sample products, a sample catalog structure and placeholder contact details. Replace the samples and contact details with your own.

---

## First 10 minutes

1. **Change the password** under **Account**.
2. **Set the real WhatsApp number** under **Store → WhatsApp number**. Every completed order opens WhatsApp addressed to this number. The current `+201000000000` is a placeholder.
3. **Check the logo** under **Store → Brand logo**. Upload a new one if needed, drag the **logo size** slider, and use **Light background behind the logo** if the mark is dark (like the current Dew logo).
4. **Edit the welcome screen** under **Store → Welcome screen**: the small line, headline, paragraph and the note above the name/phone form.
5. **Edit the rest of the storefront** under **Store → Storefront text** — header links, hero buttons and notes, the scrolling bar, collection wording, ordering section, footer, cart and checkout labels. Each group opens to its fields; save at the top.
6. **Set your contact details** — phone, email, Instagram — and your hero copy.
7. **Set up catalogs and products.** Under **Catalogs**, create groups like *Body care* or *Makeup*. Under **Products**, choose the catalog and set the **quantity in stock** for each piece.
8. **Test an order** on the storefront: add enough items to reach EGP 250, complete the form, choose an area and check the WhatsApp message and the **Orders** tab.

---

## The customer side

1. The customer enters their **name** and **phone number** (both mandatory). Their details are saved in the admin customer list.
2. They browse by catalog, search and sort.
3. Each product card and detail view has **Add to cart**. On the detail view they can choose a quantity; the cart also has − / + controls.
4. **Quantities are capped by the stock quantity set in the admin.** A sold-out product cannot be added. If stock changes while a cart is open, the cart adjusts.
5. The cart shows each piece, its unit price, quantity, line total and the items subtotal. **Complete order is blocked below EGP 250.**
6. **Checkout** collects first and last name, full address, phone and WhatsApp number. The customer chooses:
   - **Cairo & Giza — EGP 85**
   - **Alexandria — EGP 90**
7. The summary shows every product with its price, the items total, delivery and the grand total.
8. **Complete order** creates a numbered order (`DEW#1000`, `DEW#1001`, …) and opens WhatsApp with a ready message containing the order number, quantities, unit prices, line totals, delivery, grand total, name, phone, WhatsApp, address and area.
9. The order is stored in `data/db.json` and appears in **Orders**; stock is reduced at the same time.

**Minimum order:** EGP 250 for the items (before delivery). This is shown in the cart and enforced on the checkout page and by the server.

---

## The admin side

### Products

- Photos: JPG/PNG/WebP/GIF, resized in the browser, up to 8; first is the cover.
- **Price before discount** and optional **price after discount**. The saving is calculated automatically.
- **Catalog** — pick which catalog the piece belongs to.
- **Quantity in stock** — customers cannot add more than this. `0` means sold out. Low stock is highlighted automatically (3 or fewer).
- Description, how to use, how to order and tags.
- Visible in the store / feature on the homepage.
- Live/hidden toggle and delete from the product list.

### Catalogs

Create groups customers filter by — for example **Body care** (shower gel, moisturiser) or **Makeup** (lip gloss). Add a description, rename a catalog, or delete an empty one. A catalog with products must be emptied before it can be deleted. Renaming a catalog updates every product inside it.

### Customers

Every store entry is saved with name, phone number, visit count and last-seen time. Search by name or number, call, open WhatsApp, or delete a record. The top cards show total, returning and last-7-days customers.

### Orders

Every completed checkout is saved with:

- the **DEW# order number** (starting at `DEW#1000` and continuing in sequence),
- customer name, phone, WhatsApp, full address and delivery area,
- every product, quantity, unit price and line total,
- items total, delivery fee and grand total,
- **Paid**, **Shipped** and **Delivered** toggles,
- a **tracking number** field and free-text **notes** (for example “paid in cash”, “called before delivery”, “left with concierge”).

Open **Orders** to see the list and search by number, name or phone. Tap an order to see everything and save its fulfilment state, or delete it permanently. Marking an order delivered also marks it shipped. Deleting an order does not put stock back.

### Store settings

- **Brand logo** — upload PNG/JPG/WebP/SVG (SVG is rasterised automatically), resize with the live slider, and optionally put a light plate behind a dark logo.
- **Welcome screen** — small line, headline, paragraph and the form note.
- **Storefront text** — every visible storefront line, grouped and editable: navigation, hero, scrolling bar, collection, sorting, empty states, ordering section, footer, welcome form, cart, product panel and checkout.
- Store name, tagline, hero intro, currency, location, contact details, delivery note and order instructions.

### Account

Change the admin password. A warning banner stays until the starting password is replaced.

---

## Where your content lives

| Path | What it is |
| --- | --- |
| `data/db.json` | Products, catalogs, customers, orders, settings and the hashed admin password |
| `uploads/` | Product photos, the brand logo and the sample illustrations |
| `public/index.html` | Storefront |
| `public/checkout.html` | Checkout page |
| `public/admin.html` | Admin dashboard |
| `public/cart.js` | Shared cart (localStorage) |
| `public/app.js` | Storefront logic |
| `public/checkout.js` | Checkout logic |
| `public/admin.js` | Dashboard logic |
| `public/styles.css` | All styling and the colour tokens |
| `server.js` | The backend, including the order API |
| `reset-password.js` | Password recovery |

**Back up `data/db.json` and `uploads/`** — that pair is your entire shop.

Customer names and numbers are personal data. They are admin-only, never shown on the storefront, and can be deleted from the Customers screen. Include `data/db.json` in your backups and privacy policy.

---

## Everyday commands

```bash
npm start                      # http://127.0.0.1:3000
npm run reset-password         # set a new admin password (stop the server first)
PORT=8080 npm start            # another port
```

### Forgot the password?

```bash
# stop the server first (Ctrl+C)
node reset-password.js "my new strong password"
node server.js
```

Products, photos, catalogs and customers are untouched.

### Open it on your phone (same Wi‑Fi)

```bash
HOST=0.0.0.0 npm start
```

Visit `http://<your-computer-ip>:3000` from the phone. Use HTTPS for anything public.

### Put it online

This is a Node.js app, so it needs Node hosting — not just static file hosting.

**Hostinger:** `dew-skincare-live.zip` is ready to upload. Use a **Business** or **Cloud** plan with **Node.js web apps** (Premium plans do not support Node apps). Full click-by-click instructions for both Hostinger Node hosting and a Hostinger VPS are in **[DEPLOY-HOSTINGER.md](DEPLOY-HOSTINGER.md)**. For a **free** route, see the Arabic guide **[FREE-HOSTING-AR.md](FREE-HOSTING-AR.md)** (Oracle Cloud Always Free + `deploy/oracle-setup.sh`).

The short version:

- Framework: **Other** · entry file: **`server.js`** · Node **22** · start: **`npm start`**
- Environment: `NODE_ENV=production`, `HOST=0.0.0.0`
- Put the writable folders outside the deployment so redeploys cannot wipe orders or photos:
  - `DATA_DIR=/home/USERNAME/domains/YOURDOMAIN.com/shop-data`
  - `UPLOAD_DIR=/home/USERNAME/domains/YOURDOMAIN.com/shop-uploads`
- Attach the domain, enable SSL, then open `/admin.html`.

Do not set `PORT` on Hostinger — it is injected automatically. Sessions live in memory, so a restart signs everyone out, but products, orders and photos stay.

- Back up `data/` and `uploads/` regularly.

---

## Order rules (server-side)

| Rule | Value |
| --- | --- |
| Minimum items total | EGP 250 |
| Cairo & Giza delivery | EGP 85 |
| Alexandria delivery | EGP 90 |
| Payment | Cash on delivery |
| Stock | Quantity set per product; checked again on order |
| Order number | `DEW#1000`, `DEW#1001`, … |

The server recalculates every price from the database, re-checks stock, and rejects an order below the minimum or with an invalid area — the browser cannot bypass these rules.

---

## Notes for the curious

- Vanilla JavaScript and a single stylesheet; Google Fonts (Fraunces + Inter) with system fallbacks.
- Palette: near-black `#070a08`, deep green `#143c29` / `#0a2117`, red `#b33a2a`, pink `#e7a8b4` / `#f8e7eb`, cream `#f4f2e9`. Tokens are at the top of `public/styles.css`.
- Product and customer text is escaped before rendering; uploads are type-checked; the admin is rate-limited; customer data is admin-only.
- The cart lives in `localStorage`, so it survives a page reload or signing out and back in.
- The customer-facing “Store owner” and “Admin sign in” links were removed. The dashboard is only reachable at `/admin.html` — bookmark it.

### Worth adding next

Stock-low alerts, online payment, automatic courier tracking, an Arabic/RTL version, product variations (size/shade) and discount codes.
