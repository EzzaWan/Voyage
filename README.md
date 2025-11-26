# Voyage - eSIM Marketplace

This project is a monorepo containing:

- `apps/web`: Next.js frontend
- `apps/backend`: NestJS API
- `apps/worker`: Node.js worker for background tasks
- `libs/esim-access`: Shared SDK for eSIM Access API
- `libs/stripe`: Shared Stripe helpers
- `prisma`: Database schema

## Getting Started

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Run database migrations: `npx prisma migrate dev`
4. Start development: `npm run dev`

