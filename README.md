# Budget Tracker Backend

A RESTful API server for tracking personal finances, built with Express and TypeScript. It handles user authentication, transaction logging, budget management, and spending categorization -- everything the frontend needs to help users stay on top of their money.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [License](#license)

---

## Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Runtime         | Node.js                     |
| Language        | TypeScript                  |
| Framework       | Express 5                   |
| ORM             | Prisma (with PostgreSQL)    |
| Authentication  | JWT (access + refresh flow) |
| Validation      | Zod                         |
| Password Hashing| bcrypt                      |

---

## Project Structure

```
backend/
  prisma/
    schema.prisma          # Database models and enums
    migrations/            # Auto-generated migration files
  src/
    index.ts               # Application entry point
    controllers/           # Route handlers (business logic)
      auth.controller.ts
      budget.controller.ts
      category.controller.ts
      transaction.controller.ts
    routes/                # Express route definitions
      auth.routes.ts
      budget.route.ts
      category.routes.ts
      transaction.route.ts
    middleware/             # Custom middleware
      auth.middleware.ts
    schemas/               # Zod validation schemas
      auth.schema.ts
      budget.schema.ts
      category.schema.ts
      transaction.schema.ts
    utills/                # Utility helpers
      jwt.util.ts
      password.util.ts
  .env                     # Environment configuration (not committed)
  package.json
  tsconfig.json
```

---

## Prerequisites

Before you begin, make sure the following are installed on your machine:

- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or later)

---

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/kavindu919/Budget-Tracker-Backend.git
cd Budget-Tracker-Backend
npm install
```

---

## Environment Variables

Create a `.env` file in the project root. The server expects the following variables:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/budgettrack?schema=public"
JWT_ACCESS_SECRET=<a-strong-random-string>
JWT_REFRESH_SECRET=<another-strong-random-string>
NODE_ENV=development
```

| Variable             | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `PORT`               | Port the server listens on (defaults to `3001`)                |
| `FRONTEND_URL`       | Allowed CORS origin for the frontend client                    |
| `DATABASE_URL`       | PostgreSQL connection string                                   |
| `JWT_ACCESS_SECRET`  | Secret key used to sign short-lived access tokens              |
| `JWT_REFRESH_SECRET` | Secret key used to sign long-lived refresh tokens              |
| `NODE_ENV`           | Set to `development` or `production`                           |

---

## Database Setup

This project uses Prisma to manage the database schema. After configuring your `DATABASE_URL`, run the following to create the tables:

```bash
npx prisma migrate dev
```

If you just want to push the schema without creating a migration file:

```bash
npx prisma db push
```

To generate the Prisma client after any schema changes:

```bash
npx prisma generate
```

---

## Running the Server

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: `3001`). You can confirm it is running by hitting the health check endpoint:

```
GET http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "descriptin": "application working",
  "timestamp": "2026-03-10T05:00:00.000Z"
}
```

---

## API Reference

All endpoints (except auth routes) require a valid JWT access token. The token should be included as a Bearer token in the `Authorization` header.

### Authentication

| Method | Endpoint                   | Auth Required | Description                        |
| ------ | -------------------------- | ------------- | ---------------------------------- |
| POST   | `/api/auth/register`       | No            | Create a new user account          |
| POST   | `/api/auth/login`          | No            | Authenticate and receive tokens    |
| POST   | `/api/auth/refresh-tokens` | No            | Get a new access token using a refresh token |
| POST   | `/api/auth/logout`         | Yes           | Revoke the current refresh token   |
| GET    | `/api/auth/profile`        | Yes           | Retrieve the authenticated user's profile |

### Categories

Users can define custom income and expense categories.

| Method | Endpoint                           | Auth Required | Description                  |
| ------ | ---------------------------------- | ------------- | ---------------------------- |
| POST   | `/api/category/create`             | Yes           | Create a new category        |
| POST   | `/api/category/edit`               | Yes           | Update an existing category  |
| POST   | `/api/category/delete`             | Yes           | Delete a category            |
| GET    | `/api/category/get-all-categories` | Yes           | List all categories          |
| GET    | `/api/category/get-all-category`   | Yes           | Get a single category        |

### Transactions

| Method | Endpoint                                  | Auth Required | Description                         |
| ------ | ----------------------------------------- | ------------- | ----------------------------------- |
| POST   | `/api/transaction/create`                 | Yes           | Record a new transaction            |
| POST   | `/api/transaction/update`                 | Yes           | Update an existing transaction      |
| POST   | `/api/transaction/delete`                 | Yes           | Delete a transaction                |
| GET    | `/api/transaction/get-all-transactions`   | Yes           | List all transactions (with filters)|
| GET    | `/api/transaction/summary`                | Yes           | Get income/expense summary          |

### Budgets

| Method | Endpoint                    | Auth Required | Description                       |
| ------ | --------------------------- | ------------- | --------------------------------- |
| POST   | `/api/budget/create`        | Yes           | Create a budget for a category    |
| POST   | `/api/budget/edit`          | Yes           | Update a budget                   |
| POST   | `/api/budget/delete`        | Yes           | Delete a budget                   |
| GET    | `/api/budget/get-budgets`   | Yes           | List all budgets for the user     |

### Health Check

| Method | Endpoint   | Auth Required | Description              |
| ------ | ---------- | ------------- | ------------------------ |
| GET    | `/health`  | No            | Returns server status    |

---

## Data Models

The database contains the following core models (defined in `prisma/schema.prisma`):

- **User** -- Stores account credentials and profile information. Each user owns their own set of categories, transactions, and budgets.
- **Transactions** -- Records individual income and expense entries, each tied to a user and a category.
- **Budgets** -- Defines spending limits per category, with support for daily, weekly, monthly, and yearly periods. Optional alert limits can be set.
- **Categories** -- User-defined labels for organizing transactions. Each category is typed as either income or expense.
- **RefreshTokens** -- Manages JWT refresh tokens with expiration and revocation tracking.

---

## License

This project is provided as-is for personal and educational use.
