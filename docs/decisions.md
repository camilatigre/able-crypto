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
- **Streaming support**: Plugin available for real-time data updates
- **React-friendly**: react-chartjs-2 provides declarative API
- **Performance**: Adequate for 3 simultaneous charts with throttled updates
- **Customizable**: Extensive options for styling and behavior

**Alternatives considered**:
- Recharts: More React-native but weaker performance with streaming data
- Lightweight Charts: Excellent for trading apps but overkill for this scope

---

## 3. 7-Day Data Retention

**Decision**: Retain hourly averages for 7 days, then automatically delete.

**Rationale**:
- **Evaluation period**: Sufficient for testing and demonstration
- **Database size**: Keeps storage minimal (~504 records total at any time)
- **Demonstrates feature**: Shows working cleanup automation
- **Practical**: Matches expected evaluation timeline

**Implementation**: Automatic cleanup via scheduled cron job.

---

## 4. TypeORM as Database ORM

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

## 5. Docker Containerization

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

## 6. WebSocket for Real-time Communication

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

## 7. Throttling Strategy

**Decision**: Throttle updates to maximum 1 per second per currency pair.

**Rationale**:
- **Bandwidth optimization**: Reduces data transfer without losing real-time feel
- **Performance**: Prevents UI freezing from too frequent re-renders
- **User experience**: 1 update/second is smooth for financial dashboards
- **Backend efficiency**: Reduces WebSocket broadcast frequency

**Implementation**: Lodash throttle utility or custom implementation with timestamps.

---

## 8. Monorepo with npm Workspaces

**Decision**: Use npm/yarn workspaces (not Turborepo or Nx).

**Rationale**:
- **Simplicity**: Native npm feature, no additional tooling
- **Sufficient**: Meets all requirements for shared types and dependencies
- **No build cache needed**: Application is small enough
- **Learning curve**: Zero overhead, familiar to most developers

**vs. Turborepo/Nx**: Overkill for 2 apps and 1 shared package

---

## 9. NestJS @Cron for Scheduled Tasks

**Decision**: Use NestJS @Cron decorators (from @nestjs/schedule).

**Rationale**:
- **Native integration**: Part of NestJS ecosystem
- **Declarative syntax**: Clean, readable code
- **Type-safe**: Full TypeScript support
- **Testable**: Easy to mock and test scheduled jobs
- **No external daemon**: Runs in-process, simplifies deployment

**Alternative**: node-cron library directly - more manual setup, less idiomatic

---

## Summary

These decisions prioritize:
- ✅ **Clean, maintainable code** over premature optimization
- ✅ **Developer experience** with familiar, well-documented tools
- ✅ **Production-ready practices** (Docker, TypeORM, error handling)
- ✅ **Appropriate complexity** for a 3-4 hour take-home exercise



