#!/bin/bash
# Alivo — Production Setup Script
# Usage: DOMAIN=alivo.cc DB_PASSWORD=secret JWT_SECRET=secret AI_API_KEY=sk-... ./setup.sh

set -e

DOMAIN="${DOMAIN:?Set DOMAIN env var}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD env var}"
JWT_SECRET="${JWT_SECRET:?Set JWT_SECRET env var}"

echo "=== Alivo Production Setup ==="
echo "Domain: $DOMAIN"

# 1. SSL certificate
echo "→ Obtaining SSL certificate..."
certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || true

# 2. Update nginx config with actual domain
sed -i "s/alivo.cc/$DOMAIN/g" nginx.conf

# 3. Start everything
echo "→ Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for DB
echo "→ Waiting for database..."
sleep 10

# 5. Seed plans
echo "→ Seeding plans..."
docker compose -f docker-compose.prod.yml exec app npx prisma db push --skip-generate --accept-data-loss
docker compose -f docker-compose.prod.yml exec app npx ts-node prisma/seed.ts || true

echo ""
echo "=== Alivo is live! ==="
echo "https://$DOMAIN"
echo "https://$DOMAIN/api/docs"
echo ""
echo "Next steps:"
echo "1. Create Telegram bot via @BotFather, set TELEGRAM_BOT_TOKEN"
echo "2. Set up Stripe account, set STRIPE_SECRET_KEY"
echo "3. Configure STRIPE_WEBHOOK_SECRET for /api/billing/webhook/stripe"
