# Technical Decisions

This document outlines the key technical decisions made during the development of the Crypto Dashboard application and their motivations.

## Architecture

### Monorepo Structure

**Decision**: Use npm/yarn workspaces for monorepo management

**Motivation**:
- Simple and native solution (no additional tooling required)
- Easy dependency sharing between packages
- Straightforward setup for a project of this scope
- Tools like Turborepo or Nx would add unnecessary complexity for 2 apps + 1 shared package

## Backend Stack

### Database: PostgreSQL

**Decision**: Use PostgreSQL with TypeORM

**Motivation**:
- **Time-series support**: Optimized for storing and querying time-based data (hourly averages)
- **ACID compliance**: Ensures data consistency and integrity
- **Aggregation queries**: Excellent performance for AVG, GROUP BY timestamp operations
- **JSON support**: Flexibility to add metadata if needed in the future
- **Production-ready**: Battle-tested, reliable, widely supported

### ORM: TypeORM

**Decision**: Use TypeORM instead of raw PostgreSQL queries

**Motivation**:
- **Native NestJS integration**: Decorators, dependency injection, seamless setup
- **Automatic migrations**: Easy schema evolution with `migration:generate`
- **Type safety**: Entities are fully typed, reducing runtime errors
- **Repository pattern**: Reduces boilerplate code
- **Minimal overhead**: For simple queries (INSERT, SELECT, DELETE), performance impact is negligible
- **Not scaling to millions**: Our use case doesn't require raw SQL optimization

### Framework: NestJS

**Decision**: Use NestJS for the backend

**Motivation**:
- **Required by exercise**: Specified in the technical requirements
- **Production-ready**: Opinionated structure, dependency injection, modular architecture
- **TypeScript-first**: Excellent type safety
- **WebSocket support**: Native @nestjs/websockets module
- **Scheduler support**: Built-in cron job functionality via @nestjs/schedule

### Real-time Communication: WebSocket

**Decision**: Use WebSocket (not Server-Sent Events)

**Motivation**:
- **Bi-directional**: Although we only need server→client, WebSocket is more flexible
- **Native NestJS support**: @nestjs/websockets module
- **Industry standard**: More widely used and understood
- **Better tooling**: socket.io has excellent client libraries

### Job Scheduling: @Cron Decorator

**Decision**: Use NestJS @Cron decorator for hourly averages calculation

**Motivation**:
- **Native integration**: Built into NestJS via @nestjs/schedule
- **Simple syntax**: `@Cron('0 * * * *')` is clear and declarative
- **Automatic lifecycle**: NestJS manages initialization and cleanup
- **Battle-tested**: Uses node-cron under the hood

## Frontend Stack

### Framework: React

**Decision**: Use React 18 with TypeScript

**Motivation**:
- **Required by exercise**: Specified in the technical requirements
- **Industry standard**: Large community, extensive documentation
- **Hooks**: Modern approach for state management
- **TypeScript support**: Excellent type checking

### Build Tool: Vite

**Decision**: Use Vite instead of Create React App

**Motivation**:
- **Fast**: Lightning-fast HMR (Hot Module Replacement)
- **Modern**: Built for ESM, optimized for modern browsers
- **Lightweight**: Minimal configuration needed
- **Better DX**: Faster development experience

### Charts: Chart.js

**Decision**: Use Chart.js with react-chartjs-2 wrapper

**Motivation**:
- **Most popular**: ~65k GitHub stars, huge community
- **Mature**: Battle-tested, stable, well-documented
- **Streaming support**: Plugin available for real-time updates
- **React wrapper**: react-chartjs-2 provides declarative API
- **Performance**: Good enough for 3 simultaneous charts with throttled updates
- **Trade-offs considered**:
  - Recharts: More React-idiomatic but potentially slower
  - Lightweight Charts: Trading-specific but more complex for simple use case

### Styling: TailwindCSS

**Decision**: Use TailwindCSS for styling

**Motivation**:
- **Utility-first**: Fast development without leaving HTML
- **Consistency**: Design system built-in
- **Small bundle**: Purges unused styles in production
- **Responsive**: Mobile-first, easy breakpoints

## Data Management

### Data Retention: 7 Days

**Decision**: Keep only 7 days of hourly averages

**Motivation**:
- **Evaluation period**: Application will be tested within 1 week
- **Lightweight**: ~504 total records (3 pairs × 24 hours × 7 days)
- **Demonstrates functionality**: Proves hourly calculation works
- **Easy to adjust**: Can be increased if needed

### Update Frequency: 1 Second Throttle

**Decision**: Throttle frontend updates to maximum 1 per second per pair

**Motivation**:
- **Balance**: Real-time feel without overwhelming the UI
- **Performance**: Chart.js handles 1 update/second smoothly
- **Network efficiency**: Reduces WebSocket traffic
- **UX**: Human eye doesn't perceive updates faster than ~30 FPS anyway

## DevOps

### Containerization: Docker

**Decision**: Use Docker Compose for local development and deployment

**Motivation**:
- **Consistency**: Same environment across dev/test/production
- **Easy setup**: Single command (`docker-compose up`) starts everything
- **Isolation**: PostgreSQL, backend, frontend all containerized
- **No local dependencies**: No need to install PostgreSQL locally
- **Production-ready**: Easy to deploy to any Docker-compatible host

### Testing Strategy

**Decision**: Jest for backend, React Testing Library for frontend

**Motivation**:
- **Native support**: Jest works seamlessly with NestJS and React
- **RTL philosophy**: Testing from user perspective
- **Mocking**: Easy to mock WebSocket connections and database
- **Coverage**: Good balance between confidence and development speed

## Performance Optimizations

### Throttling Strategy

**Decision**: Implement throttling at multiple levels

**Implementation**:
1. **Backend**: Throttle broadcasts to frontend (1/second per pair)
2. **Frontend**: React state updates naturally batched
3. **Chart**: Limit visible data points to last 50

**Motivation**:
- **Prevent overload**: Finnhub sends 5-20 trades/second during high activity
- **Smooth UX**: Consistent update rate feels better than erratic updates
- **Resource efficiency**: Reduces CPU/memory usage

### Database Indexing

**Decision**: Add composite index on (symbol, hour)

**Motivation**:
- **Query optimization**: Main query filters by symbol and time range
- **Small overhead**: Few records, index maintenance is cheap
- **Cleanup efficiency**: Helps DELETE queries for old data

## Security Considerations

### API Key Management

**Decision**: Store Finnhub API key in environment variables

**Motivation**:
- **Security**: Never commit secrets to git
- **Flexibility**: Easy to change per environment
- **.env.example**: Template provided for easy setup

### CORS Configuration

**Decision**: Configure CORS in NestJS to allow frontend origin

**Motivation**:
- **Development**: Allow localhost:5173 (Vite default)
- **Production**: Can be restricted to specific domain
- **WebSocket**: Needs proper origin configuration

## Code Quality

### TypeScript Strict Mode

**Decision**: Enable strict mode in both backend and frontend

**Motivation**:
- **Type safety**: Catch errors at compile time
- **Better IDE support**: Improved autocomplete and refactoring
- **Documentation**: Types serve as inline documentation

### Clean Code Principles

**Followed principles**:
- **DRY**: Shared types in `@able-crypto/shared` package
- **Single Responsibility**: Each service/component has one job
- **Separation of Concerns**: Clear layers (service, gateway, entity)
- **KISS**: Simple solutions over complex abstractions

## Trade-offs and Alternatives Not Chosen

### What We Didn't Use (And Why)

**requestAnimationFrame (RAF)**:
- ❌ Not needed: Chart.js handles rendering optimization internally
- ✅ Simpler: React state updates + Chart.js is sufficient

**Debounce**:
- ❌ Not ideal: Would delay updates inconsistently
- ✅ Throttle better: Guarantees consistent update frequency

**Raw PostgreSQL (pg library)**:
- ✅ Would work: More control, lighter weight
- ❌ More boilerplate: Manual migrations, less type safety
- ❌ Less idiomatic: TypeORM is NestJS standard

**Server-Sent Events (SSE)**:
- ✅ Would work: Simpler for one-way communication
- ❌ Less flexible: Can't send messages from client if needed
- ❌ Less common: WebSocket is more widely known

## Conclusion

These decisions prioritize:
1. **Simplicity**: Use standard tools, avoid over-engineering
2. **Best practices**: Follow framework conventions (NestJS, React)
3. **Maintainability**: Clear separation, strong typing, good documentation
4. **Requirements**: Fulfill all exercise requirements without gold-plating
5. **Time-boxing**: 3-4 hour implementation window

All decisions can be revisited if requirements change or scale demands it.

