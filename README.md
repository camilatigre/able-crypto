# Crypto Dashboard - Real-time Exchange Rates

A real-time cryptocurrency dashboard that displays live exchange rates for ETH/USDC, ETH/USDT, and ETH/BTC with live charts and data updates.

## Tech Stack

**Backend**: NestJS + TypeScript + PostgreSQL + TypeORM + WebSockets  
**Frontend**: React + TypeScript + Vite + Chart.js + TailwindCSS  
**Infrastructure**: Docker + Docker Compose  
**Real-time Data**: Finnhub.io WebSocket API

## Features

- 📊 **Live Charts** - Real-time price updates with Chart.js
- ⚡ **WebSocket Streaming** - Instant data propagation from Finnhub to frontend
- 📈 **Hourly Averages** - Automatic calculation and persistence of hourly rates
- 🔄 **Auto Reconnection** - Resilient connection handling with exponential backoff
- 🐳 **Dockerized** - One command to run everything
- ✅ **Tested** - Unit and integration tests

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Finnhub API key (get one free at [finnhub.io](https://finnhub.io/register))

**Important:** You must provide your own Finnhub API key. The key should be sent separately for security reasons.

### Run the Application

```bash
# Clone the repository
git clone https://github.com/camilatigre/able-crypto.git
cd able-crypto

# Create .env file with your Finnhub API key
cp env.example .env
# Edit .env and add your FINNHUB_API_KEY (provided separately)

# Generate package-lock.json (first time if you dont have package-lock.json)
npm install

# Start all services
docker-compose up --build
```

**Important Notes:**
- The Finnhub API key must be added to `.env` file before running
- Run `npm install` at least once to generate `package-lock.json` before building Docker images

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### Stop the Application

```bash
docker-compose down
```

## Local Development (without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Finnhub API Key

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start PostgreSQL** (make sure it's running on port 5432)

3. **Configure environment variables**:
```bash
# Copy example file
cp env.example .env
# Edit .env and add your FINNHUB_API_KEY
```

4. **Start backend**:
```bash
cd apps/backend
npm install
npm run start:dev
```
Backend runs at http://localhost:3000

5. **Start frontend** (in a new terminal):
```bash
cd apps/frontend  
npm install
npm run dev
```
Frontend runs at http://localhost:5173

### Run Tests

```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test
```

## Architecture

```
┌─────────────────┐
│  Finnhub API    │ (WebSocket)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  NestJS Backend │────▶│ PostgreSQL   │
│  - WebSocket    │     │ (Hourly avg) │
│  - Throttling   │     └──────────────┘
│  - Cron jobs    │
└────────┬────────┘
         │ (WebSocket)
         ▼
┌─────────────────┐
│  React Frontend │
│  - Chart.js     │
│  - Live updates │
└─────────────────┘
```

## Project Structure

```
able-crypto/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # React App
├── packages/
│   └── shared/           # Shared TypeScript types
├── docs/
│   └── decisions.md      # Technical decisions and rationale
├── docker-compose.yml    # Docker orchestration
└── package.json          # Monorepo root
```

## Technical Decisions

See [docs/decisions.md](docs/decisions.md) for detailed explanations of architectural choices.

## Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## License

See [LICENSE](LICENSE) file.