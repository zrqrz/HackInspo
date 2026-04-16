# HackInspo

AI-first hackathon preparation tool.

## Environment Variables

Use environment variables only. Do not commit real connection strings.

Required:

- `DATABASE_URL`

Recommended setup:

- Local: set in `.env.local`
- Vercel: set in Project Settings -> Environment Variables
- Team onboarding: copy `.env.example` and fill real values locally

## Local Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

## Prisma Workflow

When `prisma/schema.prisma` changes:

```bash
npx prisma migrate dev --name <description>
npx prisma generate
npm run db:erd
```

## Pre-push Checklist

Run before push/deploy:

```bash
npm run lint
npm run type-check
npm run build
```
