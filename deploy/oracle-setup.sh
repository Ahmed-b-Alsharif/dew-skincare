#!/usr/bin/env bash
# Dew Skincare — one-command setup for a fresh Ubuntu 22.04/24.04 Oracle Cloud VM.
# Usage (after uploading the project ZIP and unzipping it to /var/www/dew):
#   sudo bash deploy/oracle-setup.sh yourdomain.com you@email.com
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="/var/www/dew"
DATA_DIR="/var/lib/dew/data"
UPLOAD_DIR="/var/lib/dew/uploads"
APP_USER="dew"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: sudo bash deploy/oracle-setup.sh yourdomain.com you@email.com"
  exit 1
fi
if [[ ! -f "$APP_DIR/server.js" && -f "./server.js" ]]; then
  APP_DIR="$(pwd)"
fi
if [[ ! -f "$APP_DIR/server.js" ]]; then
  echo "Could not find server.js in $APP_DIR. Unzip the project there first."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl unzip nginx ufw

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$DATA_DIR" "$UPLOAD_DIR" /var/log/dew
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR" "$UPLOAD_DIR" /var/log/dew

if [[ -f "$APP_DIR/package.json" ]]; then
  (cd "$APP_DIR" && sudo -u "$APP_USER" npm install --omit=dev --no-audit --no-fund)
fi

cat >/etc/systemd/system/dew.service <<SERVICE
[Unit]
Description=Dew Skincare storefront
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=DATA_DIR=$DATA_DIR
Environment=UPLOAD_DIR=$UPLOAD_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

cat >/etc/nginx/sites-available/dew <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/dew /etc/nginx/sites-enabled/dew
rm -f /etc/nginx/sites-enabled/default

ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

systemctl daemon-reload
systemctl enable --now dew
systemctl reload nginx

echo
echo "App is running on http://$DOMAIN (once DNS points here)."
echo "Admin: http://$DOMAIN/admin.html"

if [[ -n "$EMAIL" ]]; then
  apt-get install -y certbot python3-certbot-nginx
  if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
    echo "SSL is active: https://$DOMAIN"
  else
    echo "SSL could not be issued yet. Make sure DNS points to this server, then run:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
fi

echo
echo "Data folder:    $DATA_DIR"
echo "Uploads folder: $UPLOAD_DIR"
echo "Service:        systemctl status dew"
