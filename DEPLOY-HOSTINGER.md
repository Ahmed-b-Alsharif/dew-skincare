# Put Dew Skincare online

> **تبحث عن طريقة مجانية؟** اقرأ الدليل العربي: **[FREE-HOSTING-AR.md](FREE-HOSTING-AR.md)** — يشرح Oracle Cloud Always Free خطوة بخطوة، مع سكربت جاهز في `deploy/oracle-setup.sh`.

This site is a Node.js app — not a set of static HTML files — because the admin, orders, stock and customer list need a server. You need:

- your Hostinger domain,
- a hosting plan that supports **Node.js web apps** or a **VPS**,
- your real WhatsApp number,
- about 20 minutes.

---

## First: check your Hostinger plan

Hostinger supports Node.js web apps on:

- **Business** hosting
- **Unlimited** hosting
- **Cloud Startup / Professional / Enterprise / Enterprise Plus**

If you are on **Premium** or a basic shared plan, Node.js apps are not available — upgrade the plan or use a Hostinger VPS.

Reference: [How to add a Node.js web app in Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)

---

## Before you deploy

1. In the local admin, set your **real WhatsApp number**, phone, email and Instagram.
2. Change the admin password if you have not already.
3. Add your products, stock quantities and catalogs.
4. Back up `data/db.json` and the whole `uploads/` folder.
5. Make a ZIP of the project, excluding `node_modules` (there are none):

```bash
cd "/Users/ahmedalsharif/Documents/deepseek-harness/default-workspace"
zip -r dew-skincare-live.zip server.js package.json reset-password.js public data uploads DEPLOY-HOSTINGER.md README.md
```

A ready-made `dew-skincare-live.zip` is also included next to this file, with your current products, logo, orders and settings. Delete the test orders and test customer before launch if you want a clean dashboard.

---

## Option A — Hostinger Node.js web app (easiest)

### 1. Create the app

In **hPanel**:

1. **Websites → Create site**
2. Choose **Web App**
3. Choose **Upload your website files** (or connect a GitHub repo)
4. Upload `dew-skincare-live.zip`

### 2. Build settings

Use:

| Setting | Value |
| --- | --- |
| Framework | **Other** |
| Node.js version | **22** (or 20/24) |
| Entry file | `server.js` |
| Build command | `npm install` |
| Start command | `npm start` |
| Output directory | `.` or leave empty |

There is no build step; `server.js` serves the pages, API, admin and uploads.

### 3. Environment variables

In the deployment screen, open **Environment variables** and add:

```text
NODE_ENV=production
HOST=0.0.0.0
DATA_DIR=/home/USERNAME/domains/YOURDOMAIN.com/shop-data
UPLOAD_DIR=/home/USERNAME/domains/YOURDOMAIN.com/shop-uploads
```

Replace `USERNAME` and `YOURDOMAIN.com` with the values shown in Hostinger's File Manager (for example `/home/u123456789/domains/dewskincare.com/shop-data`).

**Do not set `PORT`** — Hostinger assigns it automatically. The app already reads `process.env.PORT`.

Why the two folders? Hostinger creates a new build folder when you redeploy the app. If orders and photos are stored inside the deployment, they can be replaced. Keeping `data` and `uploads` outside the build folder keeps them safe. On the first start, the app copies the bundled database, logo and images into these folders if they are empty.

Create both folders in **File Manager** before the first deploy, or let the app create them if the parent folder is writable. Permissions should allow the Node process to write there (normally `755` or `775`).

### 4. Domain + SSL

- Attach your Hostinger domain (or a subdomain such as `shop.yourdomain.com`) to the Node app.
- If the domain is registered at Hostinger, DNS is handled automatically when you attach it to the site.
- Enable **free SSL** and wait for it to become active.
- Open `https://YOURDOMAIN.com` and `https://YOURDOMAIN.com/admin.html`.

### 5. After the first deploy

1. Sign in at `/admin.html` with your password.
2. Check **Store → WhatsApp number** — the placeholder `+201000000000` must be replaced.
3. Test a small order end to end.
4. Check that a newly uploaded product photo still exists after a **Restart** or redeploy.

If images or orders disappear after a redeploy, `DATA_DIR`/`UPLOAD_DIR` are not pointing outside the build folder, or the process cannot write there. Move to Option B (VPS) if you need full control.

### Hostinger Node limits

One Node app runs as one long-lived process. The plan has process/memory limits, a 120-second request limit and no inbound WebSockets. This shop does not use WebSockets or background workers, so it fits comfortably. See [Hostinger Node.js limits](https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/).

---

## Option B — Hostinger VPS (most reliable)

Choose a KVM 1 or KVM 2 VPS with Ubuntu 24.04. This gives you a normal server, persistent disk, your own ports and no build-folder surprises.

### 1. Point the domain

In Hostinger → **Domains → DNS**, set:

- `A` record `@` → your VPS IPv4 address
- `A` record `www` → your VPS IPv4 address

Wait for DNS to resolve. If you use Cloudflare, set the records to DNS-only while testing.

### 2. Install Node and Nginx

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
node --version    # should print v22.x
```

### 3. Upload the app

From your Mac:

```bash
rsync -av --exclude node_modules \
  "/Users/ahmedalsharif/Documents/deepseek-harness/default-workspace/" \
  root@YOUR_SERVER_IP:/var/www/dew/
```

Then on the server:

```bash
sudo mkdir -p /var/lib/dew/data /var/lib/dew/uploads
sudo chown -R www-data:www-data /var/www/dew /var/lib/dew
sudo chmod -R 755 /var/www/dew
```

### 4. Run it as a service

Create `/etc/dew.env`:

```text
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
DATA_DIR=/var/lib/dew/data
UPLOAD_DIR=/var/lib/dew/uploads
```

Create `/etc/systemd/system/dew.service`:

```ini
[Unit]
Description=Dew Skincare storefront
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/dew
EnvironmentFile=/etc/dew.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dew
sudo systemctl status dew
```

### 5. Nginx + SSL

Create `/etc/nginx/sites-available/dew`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name YOURDOMAIN.com www.YOURDOMAIN.com;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/dew /etc/nginx/sites-enabled/dew
sudo nginx -t
sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOURDOMAIN.com -d www.YOURDOMAIN.com
```

Open `https://YOURDOMAIN.com`.

### 6. Updates

```bash
rsync -av --exclude node_modules /local/path/ root@SERVER:/var/www/dew/
sudo systemctl restart dew
```

The database and uploads in `/var/lib/dew` are untouched.

---

## Option C — external Node host + Hostinger domain

If you prefer not to manage a server, deploy this app to a Node host that offers a persistent disk (Render, Railway, Fly.io, etc.), then point the Hostinger domain at it:

- Add the custom domain in the Node host.
- In Hostinger DNS, use the A/CNAME records the host gives you.
- Set the same environment variables (`NODE_ENV`, `HOST`, `DATA_DIR`, `UPLOAD_DIR`, and the host-assigned `PORT` if needed).
- Make sure the disk is mounted at the `DATA_DIR` and `UPLOAD_DIR` paths.

A platform without persistent disk will lose orders and photos when it redeploys.

---

## Post-launch checklist

- [ ] `https://YOURDOMAIN.com` loads over HTTPS.
- [ ] `https://YOURDOMAIN.com/admin.html` loads; password changed.
- [ ] WhatsApp number is real and an order opens the correct chat.
- [ ] Order appears in **Orders** with a `DEW#` number.
- [ ] Product photo upload survives a restart/redeploy.
- [ ] `data` and `uploads` are backed up.
- [ ] Customer-facing admin links are hidden (they are; `/admin.html` is direct only).
- [ ] Test on a phone using mobile data, not just Wi-Fi.
- [ ] Store contact details and sample products are replaced.
- [ ] Test orders are deleted (Orders → open order → Delete order).
- [ ] Test customer records are deleted if you do not want them in the live dashboard.

## Troubleshooting

**503 / app not starting** — check Hostinger's Node logs. The app must bind to `0.0.0.0` and use the injected `PORT`; make sure `NODE_ENV=production` and `HOST=0.0.0.0` are set.

**500 on first load** — check that `DATA_DIR` and `UPLOAD_DIR` exist and are writable by the Node process.

**Orders or photos vanish after redeploy** — the data folders are inside the build. Set `DATA_DIR`/`UPLOAD_DIR` to folders outside `hbuilds`, or use a VPS.

**Photos upload but do not display** — confirm `UPLOAD_DIR` is the same folder used at startup and that its parent is writable. The app serves `/uploads/*` from that folder.

**WhatsApp opens the wrong chat** — the store's WhatsApp number is still the placeholder; change it under **Store → WhatsApp number** and save.
