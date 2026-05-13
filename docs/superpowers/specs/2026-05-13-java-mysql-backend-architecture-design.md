# Java MySQL Backend Architecture Design

## Context

The current repository contains two backend paths:

- `flower-shop-backend`: Express 5 + JSON file persistence
- `flower-shop-backend-java`: Spring Boot 3 + MySQL-oriented backend foundation

The business requirement is to move the system to a more enterprise-style backend architecture while switching persistence to MySQL and keeping the existing frontend applications unchanged.

The user selected these constraints explicitly:

- Java backend is the mainline direction
- MySQL is the target database
- frontend contract must remain compatible
- migration should follow enterprise-style technical and architectural standards

This means the Node/JSON backend is no longer the target architecture. It becomes a legacy reference and short-term fallback only.

## Goals

- Make `flower-shop-backend-java` the long-term primary backend.
- Use MySQL 8 as the system of record.
- Preserve `/api/*` contract compatibility so Web and mini-program clients can switch without frontend rewrites.
- Evolve the Java backend into a maintainable enterprise-style modular monolith.
- Introduce schema management, migration discipline, and operational readiness consistent with enterprise backend standards.

## Non-Goals

- No frontend protocol redesign.
- No microservice split in this implementation cycle.
- No event bus, saga orchestration, or cross-service decomposition.
- No cart, payment, or order domain expansion.
- No distributed infrastructure requirements beyond what is necessary for the Java/MySQL backend itself.

## Recommended Architecture

## 1. System Shape

The recommended target is a **modular monolith**:

- runtime: one Spring Boot application
- persistence: one MySQL database
- deployment: one backend service process
- external API: one `/api/*` surface

This is the correct tradeoff for the current domain size:

- large enough to justify strong module boundaries
- small enough that microservices would add operational cost without proportional business value

## 2. Backend Mainline

`flower-shop-backend-java` becomes the primary backend implementation.

`flower-shop-backend` remains useful only for:

- reference behavior comparison during migration
- temporary rollback during cutover

It is not the target for continued feature investment.

## 3. Compatibility Strategy

Compatibility is a hard constraint.

The Java backend must preserve:

- route paths
- request semantics
- response field names
- error response shape: `{ "message": "..." }`
- upload response shape: `{ "url": "..." }`
- Bearer token admin flow

This allows:

- Web app zero-code API migration
- mini-program zero-code API migration
- staged backend cutover with minimal application-layer disruption

## Technology Decisions

## 1. Runtime and Framework

- Java 17
- Spring Boot 3
- Spring Web MVC
- Spring Security
- Spring Validation

Rationale:

- standard enterprise Java baseline
- mature ecosystem
- clean integration with auth, validation, configuration, and ops tooling

## 2. Persistence Stack

- MySQL 8
- MyBatis-Plus
- Flyway

Rationale:

- MySQL 8 is a pragmatic default relational database for this project size
- the repository already contains MyBatis-Plus and Flyway setup
- preserving that direction reduces migration cost and avoids unnecessary ORM churn

## 3. Authentication

- JWT Bearer tokens
- Spring Security filter chain
- configurable secret and token lifetime

Rationale:

- compatible with the current frontend behavior
- operationally straightforward
- fits the current single-admin model without introducing session storage

## 4. File Storage

- keep a storage abstraction
- initial implementation can remain local filesystem-backed
- storage service boundary must allow future OSS/S3 migration without business-layer rewrites

## Module Boundaries

The backend should be structured as business modules inside a single service.

## 1. `auth-admin`

Responsibilities:

- admin login
- current admin identity lookup
- token issuance and parsing
- security policy hooks such as login throttling and auth validation

Primary endpoints:

- `POST /api/admin/login`
- `GET /api/admin/me`

## 2. `flower-catalog`

Responsibilities:

- flower list
- flower detail
- related flowers
- flower CRUD
- category reads
- aggregate composition of images, materials, and tags

Primary endpoints:

- `GET /api/flowers`
- `GET /api/flowers/{id}`
- `GET /api/flowers/{id}/related`
- `POST /api/flowers`
- `PUT /api/flowers/{id}`
- `DELETE /api/flowers/{id}`
- `GET /api/categories`

## 3. `site-content`

Responsibilities:

- site configuration
- homepage hero content
- stats
- shop info
- brand story
- team members

Primary endpoints:

- `GET /api/site-config`
- `PUT /api/site-config`
- `GET /api/shop-info`
- `GET /api/brand-story`
- `GET /api/team`

## 4. `contact`

Responsibilities:

- public contact submission
- persistence of contact records
- later extensibility for admin-side review and lifecycle management

Primary endpoint:

- `POST /api/contact`

## 5. `file-storage`

Responsibilities:

- uploaded image persistence
- public URL generation
- storage policy abstraction

Primary endpoint:

- `POST /api/uploads`

## Layering Model

Each module should follow a clear layered design:

- `controller`
- `service`
- `mapper`
- `entity`
- `dto`
- `converter` or `assembler`

### Controller

- HTTP concerns only
- request validation entry
- response shaping boundary
- no business orchestration logic

### Service

- business rules
- query orchestration
- transaction boundaries
- write coordination across main and child tables

### Mapper

- database interaction via MyBatis-Plus

### Entity

- relational persistence model

### DTO

- request and response transport contracts

### Converter / Assembler

- entity graph to API contract mapping
- critical because the relational model will be normalized while the frontend contract expects flattened arrays

## Database Design

## 1. Core Catalog Tables

### `flowers`

Main flower table.

Fields should include:

- `id`
- `name`
- `category_id`
- `price`
- `description`
- `meaning`
- `featured`
- `sort`
- `created_at`
- `updated_at`

### `flower_images`

One-to-many image list.

Fields:

- `id`
- `flower_id`
- `image_url`
- `sort`

### `flower_materials`

One-to-many materials.

Fields:

- `id`
- `flower_id`
- `material_name`
- `sort`

### `flower_tags`

One-to-many tags.

Fields:

- `id`
- `flower_id`
- `tag_name`
- `sort`

### `categories`

Category reference table.

Fields:

- `id`
- `name`
- `icon`
- `description`
- `sort`

## 2. Site Content Tables

### `site_config`

Stores homepage and brand-wide configuration:

- brand name
- hero eyebrow
- hero title
- hero description
- hero image
- CTA text
- contact intro
- business hours text
- footer description

### `site_config_stats`

Stores homepage stat items as rows instead of JSON.

Fields:

- `id`
- `site_config_id` or singleton config reference
- `value`
- `label`
- `sort`

### `shop_info`

Store contact and location data:

- `name`
- `phone`
- `wechat`
- `address`
- `latitude`
- `longitude`

### `brand_story`

- `title`
- `subtitle`
- `content`

### `brand_story_images`

- `id`
- `brand_story_id`
- `image_url`
- `sort`

### `team_members`

- `id`
- `name`
- `title`
- `avatar`
- `bio`
- `sort`

## 3. Contact Table

### `contacts`

Fields:

- `id`
- `name`
- `phone`
- `message`
- `created_at`

## 4. Design Principles

- normalize array-like API fields into child tables rather than storing JSON blobs
- preserve existing business IDs where useful for compatibility
- use `created_at` and `updated_at` consistently on mutable core tables
- add indexes to lookup and sort columns used by public APIs

## API Compatibility Rules

The relational model is not allowed to leak into the public API.

For example, the frontend still expects:

- `images: string[]`
- `materials: string[]`
- `tags: string[]`
- `stats: [{ value, label }]`

The Java backend must assemble those API responses from normalized tables.

This is an explicit architectural responsibility of the service + converter layer.

## Schema and Migration Discipline

## 1. Flyway as the only schema change path

All schema creation and evolution must go through Flyway migrations.

No manual production schema drift should be part of the normal engineering workflow.

## 2. Environment-driven configuration

These must be externalized:

- database URL
- database username/password
- admin username/password
- JWT secret
- public base URL
- upload directory

No production credentials belong in source control.

## 3. Constraint and index discipline

Use:

- primary keys
- foreign keys where operationally appropriate
- uniqueness constraints where business identity requires them
- indexes for:
  - `flower.category_id`
  - `flower.featured`
  - `flower.sort`
  - `flower.created_at`
  - contact creation time

## Security and Operational Standards

The enterprise baseline for this backend should include:

- Spring Security for authenticated admin endpoints
- JWT validation in a filter
- environment-configured secrets
- input validation via Bean Validation and service-level constraints
- structured logs for auth, upload, and failure paths
- health endpoint retention

This design does not require microservice-grade platform components to be considered enterprise-appropriate.

## Migration Strategy

## Phase 1: Complete Java backend compatibility

Before any cutover:

- all required `/api/*` endpoints must be implemented
- response shapes must match current frontend expectations
- upload behavior and admin auth behavior must match current client integration needs

## Phase 2: Migrate JSON data to MySQL

Source:

- `flower-shop-backend/data/db.json`

Target:

- normalized MySQL schema

Migration scope includes:

- flowers
- images
- materials
- tags
- categories
- site config
- stats
- shop info
- brand story
- brand story images
- team members
- contacts if present

### Migration Rules

- preserve logical business IDs where already stable
- split arrays into child tables
- validate row counts after import
- perform spot-checks on serialized API responses after migration

## Phase 3: Dual-run validation

Run Java backend separately from Node backend during validation.

Recommended validation model:

- keep Node backend available as reference
- run Java backend on alternate environment or port for test comparison
- temporarily point frontend config to Java backend for full-page verification

Validation targets:

- public pages
- admin login
- flower CRUD
- image upload
- site configuration editing
- mini-program reads

## Phase 4: Cutover

When compatibility is verified:

- route production traffic to Java backend
- keep Node backend as short-term rollback option
- retire Node backend after stabilization window

## Why this is the recommended enterprise path

This architecture is recommended because it is:

- consistent with the repository’s existing Java direction
- operationally simpler than microservices
- structurally cleaner than evolving the JSON file backend
- compatible with zero-frontend-change migration
- scalable enough for the current business domain

It uses enterprise patterns where they matter:

- strong module boundaries
- schema-managed relational persistence
- layered service design
- security and configuration discipline

without introducing unnecessary distributed-system cost.

## Scope Summary

This design establishes:

- Java as the long-term backend
- MySQL as the source of truth
- frontend-compatible API continuity
- modular monolith architecture
- normalized relational schema
- phased migration from JSON/Node to Java/MySQL

It intentionally avoids:

- microservice decomposition
- frontend contract changes
- infrastructure-heavy platform redesign in the first migration cycle
