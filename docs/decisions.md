# Technical Decisions

This document records the key architectural and technical decisions made for the Crypto Dashboard project.

## 1. PostgreSQL Database

**Decision**: Use PostgreSQL as the primary database.

**Rationale**:
- **Time-series optimization**: Native support for timestamp-based queries, essential for hourly averages
- **ACID compliance**: Ensures data consistency for financial data
- **TypeORM integration**: Excellent first-class support in NestJS ecosystem
- **Aggregate functions**: Efficient `AVG()`, `GROUP BY` operations for calculating hourly rates
- **JSON support**: Flexibility to add metadata if needed in the future
- **Reliability**: Battle-tested, production-ready for financial applications

**Trade-offs**:
- Requires additional infrastructure (vs SQLite)
- Slightly more complex setup
- But: Better for production-like environment demonstration

---

## 2. Chart.js for Data Visualization

**Decision**: Use Chart.js with react-chartjs-2 wrapper.

**Rationale**:
- **Most popular**: ~65k GitHub stars, largest community
- **Mature and stable**: Well-tested, extensive documentation
- **Performance**: Canvas-based rendering, better for real-time streaming
- **React-friendly**: react-chartjs-2 provides declarative API
- **Fine-grained control**: Imperative updates via refs for optimized real-time rendering
- **Adequate for 3 simultaneous charts** with throttled updates (1/sec)

**Implementation Details**:
- Configuration extracted to `chart-config.ts` for reusability
- Chart wrapped in `PriceChart` component following Single Responsibility Principle
- Update mode set to 'none' for smooth real-time feel without animation lag

**Alternatives considered**:
- Recharts: More React-native but slower canvas-less rendering
- Lightweight Charts: Excellent for trading apps but overkill for this scope

---

## 3. Component Architecture & Separation of Concerns

**Decision**: Break down components following Atomic Design and Single Responsibility Principle.

**Rationale**:
- **Maintainability**: Each component has one clear purpose
- **Testability**: Small, focused units are easier to test in isolation
- **Reusability**: Generic components can be composed in different contexts
- **Readability**: Clear component hierarchy and data flow

**Implementation**:

```
PriceCard (Organism - Container)
├── PriceChange (Atom)         → Display trend indicator
├── PriceInfo (Molecule)       → Display price metrics
└── PriceChart (Molecule)      → Render Chart.js with config
    └── chart-config.ts        → Centralized Chart.js options
```

**Best Practices Applied**:
1. **Container/Presentational Pattern**: `PriceCard` orchestrates, children present
2. **Props Drilling Minimized**: Each component receives only what it needs
3. **Logic Extraction**: Chart configuration in separate file, not inline
4. **Pure Functions**: Calculations (decimals, isPositive) kept simple and pure
5. **Type Safety**: All components have explicit TypeScript interfaces

**Before** (Monolithic):
- ❌ 109 lines in one component
- ❌ Mixed concerns (data, presentation, config)
- ❌ Hard to test chart logic separately
- ❌ Difficult to reuse parts

**After** (Modular):
- ✅ 4 focused components (~20-50 lines each)
- ✅ Clear separation of concerns
- ✅ Each part testable independently
- ✅ Components reusable across the app

---

## 4. 7-Day Data Retention

**Decision**: Retain hourly averages for 7 days, then automatically delete.

**Rationale**:
- **Evaluation period**: Sufficient for testing and demonstration
- **Database size**: Keeps storage minimal (~504 records total at any time)
- **Demonstrates feature**: Shows working cleanup automation
- **Practical**: Matches expected evaluation timeline

**Implementation**: Automatic cleanup via scheduled cron job.

---

## 5. TypeORM as Database ORM

**Decision**: Use TypeORM instead of raw SQL queries.

**Rationale**:
- **NestJS integration**: Native support with decorators and dependency injection
- **Type-safety**: Entities are fully typed, reducing runtime errors
- **Automatic migrations**: Schema evolution is managed and versioned
- **Repository pattern**: Reduces boilerplate for CRUD operations
- **Developer experience**: Faster development for simple queries
- **Scope appropriate**: For this application's simple queries (INSERT, SELECT, DELETE), overhead is minimal

**Trade-offs**:
- Slight abstraction overhead vs raw SQL
- Additional dependencies
- But: Benefits outweigh costs for this scope; we're not optimizing for millions of records

---

## 6. Docker Containerization

**Decision**: Dockerize all services (PostgreSQL, backend, frontend).

**Rationale**:
- **Consistent environment**: Guarantees same behavior across development and evaluation
- **Simplified setup**: Single `docker-compose up` command starts everything
- **Dependency isolation**: No need to install PostgreSQL, Node.js, etc. locally
- **Production-ready**: Demonstrates understanding of modern deployment practices
- **Evaluator-friendly**: Reduces setup friction for code reviewers

**Implementation**:
- Multi-stage builds for optimized image sizes
- Health checks for service dependencies
- Volume persistence for database data

---

## 7. WebSocket for Real-time Communication

**Decision**: Use WebSocket (not polling or SSE) for both Finnhub connection and frontend communication.

**Rationale**:
- **Bidirectional**: Supports future features like commands from frontend
- **Efficient**: Single persistent connection vs repeated HTTP requests
- **Low latency**: Near-instant data propagation
- **Standard protocol**: Well-supported in browsers and NestJS
- **Finnhub requirement**: WebSocket API is the recommended approach

**vs. Polling**: Would create unnecessary server load and higher latency  
**vs. SSE**: Unidirectional, less flexible for future enhancements

---

## 8. Throttling Strategy

**Decision**: Throttle updates to maximum 1 per second per currency pair.

**Rationale**:
- **Bandwidth optimization**: Reduces data transfer without losing real-time feel
- **Performance**: Prevents UI freezing from too frequent re-renders
- **User experience**: 1 update/second is smooth for financial dashboards
- **Backend efficiency**: Reduces WebSocket broadcast frequency

**Implementation**: Lodash throttle utility or custom implementation with timestamps.

---

## 9. Monorepo with npm Workspaces

**Decision**: Use npm/yarn workspaces (not Turborepo or Nx).

**Rationale**:
- **Simplicity**: Native npm feature, no additional tooling
- **Sufficient**: Meets all requirements for shared types and dependencies
- **No build cache needed**: Application is small enough
- **Learning curve**: Zero overhead, familiar to most developers

**vs. Turborepo/Nx**: Overkill for 2 apps and 1 shared package

---

## 10. NestJS @Cron for Scheduled Tasks

**Decision**: Use NestJS @Cron decorators (from @nestjs/schedule).

**Rationale**:
- **Native integration**: Part of NestJS ecosystem
- **Declarative syntax**: Clean, readable code
- **Type-safe**: Full TypeScript support
- **Testable**: Easy to mock and test scheduled jobs
- **No external daemon**: Runs in-process, simplifies deployment

**Alternative**: node-cron library directly - more manual setup, less idiomatic

---

## 11. Single Buffer vs Multiple Time Buckets

**Decision**: Use a single in-memory buffer for all incoming trades, cleared after successful hourly save.

**Rationale**:
- **Simplicity**: Single `Map<symbol, PriceData[]>` is straightforward
- **Sufficient for exercise**: Demonstrates understanding without over-engineering
- **Graceful degradation**: On database failure, retains data for retry (though mixed with next hour's data)

**Trade-offs**:
- ✅ Simple implementation and testing
- ✅ Automatic retry on failure (keeps data in buffer)
- ❌ **Imperfect retry**: Failed hour's data gets mixed with next hour's data in the average
- ❌ **Memory leak potential**: If database never recovers, buffer grows indefinitely
- ❌ **Data loss on restart**: Buffer is in RAM, lost on application restart

**Alternative considered - Multiple Time Buckets**:
```typescript
// Not implemented (over-engineering for this scope)
priceBuffer: Map<string, Map<hourTimestamp, PriceData[]>>
// Would maintain separate buckets per hour, enabling:
// - Clean retry (save specific hour independently)
// - Better data integrity
// - Controlled memory (drop old buckets after N retries)
```

**Why not implemented**: Adds significant complexity for marginal benefit in a take-home exercise. The simpler approach demonstrates core concepts while remaining production-viable for temporary failures.

**Buffer lifecycle**:
- **Normal operation**: Data stays in memory max ~55 minutes (until next hour's cron)
- **Database failure**: Data accumulates until successful save (retry on next cron)
- **Application restart**: All buffer data is lost (in-memory only)
- **Memory management**: No max size limit (assumes database recovers quickly)

---

## Summary

These decisions prioritize:
- ✅ **Clean, maintainable code** over premature optimization
- ✅ **Developer experience** with familiar, well-documented tools
- ✅ **Production-ready practices** (Docker, TypeORM, error handling)
- ✅ **Appropriate complexity** for a 3-4 hour take-home exercise



