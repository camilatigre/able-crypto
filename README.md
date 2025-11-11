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

### Run the Application

```bash
# Clone the repository
git clone https://github.com/camilatigre/able-crypto.git
cd able-crypto

# Set your Finnhub API key (or use default in docker-compose.yml)
export FINNHUB_API_KEY=your_api_key_here

# Start all services
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### Stop the Application

```bash
docker-compose down
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