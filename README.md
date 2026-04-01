# nohanml — Portfolio

Monorepo containing the Angular 21 frontend and NestJS 10 backend for my personal portfolio.

## Structure

```
nohanml/
├── frontend/   # Angular 21 — deployed on Vercel
└── backend/    # NestJS 10 — deployed on Railway
```

## Getting started

### Frontend

```bash
cd frontend
npm install
ng serve
# → http://localhost:4200
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run start:dev
# → http://localhost:3000/api/v1
# → http://localhost:3000/api/docs (Swagger)
```

## Tech stack

- **Frontend**: Angular 21, NgRx Signal Store, SCSS
- **Backend**: NestJS 10, TypeORM, PostgreSQL, Nodemailer
- **CI/CD**: GitHub Actions → Vercel + Railway
