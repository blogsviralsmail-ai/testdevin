#!/bin/bash
# Deploy InternPro to VPS
# IMPORTANT: Never sync prisma/dev.db - it will wipe the production database!

set -e

VPS_HOST="155.254.22.197"
VPS_USER="root"
VPS_PATH="/var/www/internpro/internpro"

echo "Building..."
npm run build

echo "Syncing files to VPS (excluding node_modules, .git, database)..."
sshpass -p 'oB(]V9674mHYts' rsync -avz \
  --exclude node_modules \
  --exclude .git \
  --exclude 'prisma/dev.db' \
  --exclude 'prisma/dev.db-journal' \
  --exclude '.env' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "Running prisma generate on VPS..."
sshpass -p 'oB(]V9674mHYts' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} \
  "cd ${VPS_PATH} && npx prisma generate"

echo "Restarting PM2..."
sshpass -p 'oB(]V9674mHYts' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} \
  "pm2 restart internpro"

echo "Deploy complete! Check https://internship.kkhsmedia.com"
