# TC-costing_dashboard

**First-time-only setup:**

echo "TC_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" > .env
docker compose up --build -d


**After changing code in backend/src/:**

docker compose up --build -d backend

**90% case:**

cd TC-costing_dashboard

docker compose up -d

docker compose ps

