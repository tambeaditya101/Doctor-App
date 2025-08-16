# Scaling DocBook to 5,000 Appointments/Day

This document outlines how the current DocBook platform (React + Node.js/Express + PostgreSQL + JWT) can evolve to handle ~5,000 appointments per day across ~1,000 doctors, while remaining reliable and performant.

---

## 1. API Layer (Express/Node.js)

- **Stateless APIs**:  
  Each request should be independent, with JWT auth used for session-less security. This enables horizontal scaling with multiple Node.js instances behind a load balancer (e.g., Nginx/HAProxy/ELB).

- **Pagination & Filtering**:  
  All "list" endpoints (doctors, appointments) should support pagination (`limit`, `offset`) and filters (`date`, `doctor_id`, `status`) to avoid returning huge datasets.

- **Rate Limiting**:  
  Protect the system from abuse (e.g., appointment spamming). Use middleware like `express-rate-limit` or Redis-based limiters.

- **Caching**:

  - Doctor profile & availability queries can be cached in **Redis** (short TTL like 30–60s).
  - API responses that are repeated often (e.g., "discover doctors") should hit cache first.

- **Async Jobs (Queues)**:  
  For non-critical tasks like sending email/OTP notifications, use a queue system (BullMQ + Redis, or RabbitMQ).  
  This avoids blocking API responses during heavy load.

---

## 2. Database Layer (PostgreSQL)

- **Indexes**:  
  Create indexes on:

  - `appointments(doctor_id, start_time)` → fast lookups by doctor and date
  - `users(email)` → fast auth lookup
  - `availability(doctor_id, date)` → fast slot queries

- **Connection Pooling**:  
  Use a pool manager (e.g., `pg-pool`) to efficiently reuse DB connections. At scale, direct connections per request will overload Postgres.

- **Partitioning**:  
  If appointment volume grows beyond millions:

  - **Time-based partitioning** of `appointments` (e.g., monthly tables).
  - Queries for recent data remain fast, old data archived.

- **Read Replicas**:  
  Scale reads by having read replicas for analytics/reporting while writes go to the primary DB.

---

## 3. Architecture & Infrastructure

- **Load Balancer**:  
  Place a load balancer (Nginx or AWS ELB) in front of multiple Node.js backend instances.

- **Horizontal Scaling**:  
  Add more backend instances when traffic grows. Stateless design + JWT auth make this straightforward.

- **Service Separation (Future)**:  
  Split monolith into microservices when needed:

  - `auth-service`
  - `booking-service`
  - `doctor-service`

- **Monitoring & Alerts**:  
  Use tools like Prometheus + Grafana or Datadog for tracking:
  - API latency
  - DB query times
  - Appointment booking failure rate

---

## 4. Appointment Booking Concurrency

- **Atomic Booking**:  
  To prevent double-booking:

  - Wrap appointment booking in a DB transaction.
  - Use `SELECT … FOR UPDATE` to lock the availability slot row before inserting.

- **Idempotency Keys**:  
  Clients can send a unique key for each booking request.  
  If retried (due to network errors), the same key avoids duplicate appointments.

---

## 5. Bonus Features (Planned Evolutions)

### Doctor Login + Calendar View

- Doctors can log in and view all upcoming appointments in a calendar/table.
- Backend endpoint: `GET /doctor/:id/appointments?date=...`

### Recurring Availability

- Doctors define recurring rules (e.g., "Mon–Fri, 10–2").
- A scheduler expands rules into actual availability slots in DB (denormalized for fast lookups).

### Calendar-based Slot Picker

- Frontend UI with a date picker + time slots.
- API provides: `GET /doctor/:id/slots?date=2025-08-16`

### API Rate Limiting

- Per-user/IP rate limiting on booking endpoints.
- Prevents spam appointment creation.

### CI/CD

- GitHub Actions pipeline:
  - Run `npm test` + `npm run lint` on PRs.
  - Deploy to Render (backend) and Vercel (frontend) on `main` branch merges.

### Deployment

- **Backend**: Render (Postgres add-on + Node API).
- **Frontend**: Vercel (React build).
- **Environment Variables**: managed in Render/Vercel dashboards.

---

## 6. Scaling Summary

By combining:

- Stateless backend + JWT
- Indexed/partitioned PostgreSQL
- Redis for caching + queues
- Horizontal scaling behind a load balancer
- Transaction-safe booking

…DocBook can comfortably handle **5,000+ appointments/day** and scale beyond as usage grows.
