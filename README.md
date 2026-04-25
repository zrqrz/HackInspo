# HackInspo

AI-first hackathon preparation tool.

## Environment Variables

Use environment variables only. Do not commit real connection strings.

Required:

- `DATABASE_URL`: PostgreSQL connection URL

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env
```

Then edit `.env` and set `DATABASE_URL` to your PostgreSQL database URL.

Prepare the database:

```bash
npx prisma migrate deploy
npx prisma generate
python -m pipeline.db.ingest
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
