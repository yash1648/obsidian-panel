# Minecraft Hosting Control Panel — Complete Architecture Suite

> A production-grade admin PaaS for Minecraft server management, inspired by Pterodactyl Panel but built ground-up with Java/Spring Boot and Angular.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Product Vision](./01_product_vision.md) | Core promise, feature list, product goal |
| 02 | [System Architecture (HLD)](./02_hld.md) | High-level design, service decomposition |
| 03 | [Domain Model & Database Schema](./03_domain_model.md) | Entities, relationships, schema |
| 04 | [Backend LLD](./04_backend_lld.md) | Spring Boot modules, services, package structure |
| 05 | [API Contracts](./05_api_contracts.md) | REST + WebSocket endpoint definitions |
| 06 | [Frontend Architecture](./06_frontend.md) | Angular modules, UI wireframes, component map |
| 07 | [Docker Orchestration](./07_docker.md) | Container lifecycle, volume strategy, networking |
| 08 | [Security Architecture](./08_security.md) | RBAC, JWT, audit, threat model |
| 09 | [Deployment Architecture](./09_deployment.md) | MVP and production deployment |
| 10 | [Development Roadmap](./10_roadmap.md) | Phased delivery plan, LOC estimates |

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Angular 19+, TailwindCSS, Angular Material, RxJS, xterm.js, Monaco Editor, Chart.js |
| Backend | Spring Boot 3, Java 21, Spring Security, Spring Data JPA, Spring WebSocket, Spring Scheduler |
| Database | PostgreSQL |
| Cache | Redis |
| Container Runtime | Docker Engine via docker-java |
| Messaging (optional) | RabbitMQ |
| Monitoring | Micrometer, Prometheus, Grafana |
| Reverse Proxy | Nginx |
