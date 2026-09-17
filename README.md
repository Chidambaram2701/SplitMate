# RoommateX - House Financial Platform

A brutalist, production-quality full-stack web application for managing shared house finances for college students.

## Features

- **Multi-house support** - Manage multiple houses with strict data isolation
- **Expense tracking** - Track shared and personal expenses
- **Debt management** - Track who owes whom with partial payments
- **Asset management** - Track house assets and ownership
- **Member management** - Invite, manage, and handle member exits
- **Settlements** - Simplify complex debt settlements
- **Automated reminders** - Get notified about upcoming payments

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **UI**: Custom Brutalist Design System
- **Deployment**: Vercel

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the project URL and anon key from Project Settings > API

### 3. Set Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

Execute the migration file at `supabase/migrations/0001_initial_schema.sql` in your Supabase SQL Editor.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Brutalist Design

RoommateX uses a bold, functional design style inspired by:

- Financial terminals
- Editorial design
- Industrial Brutalism

Key design elements:
- Bold high-contrast colors (black, white, yellow accents)
- Thick borders (2-3px solid black)
- Offset shadows for depth
- Square corners (border-radius: 0)
- Monospace typography for financial data
- Bold uppercase headings

## Project Structure

```
app/
├── api/                    # API routes
├── auth/                   # Auth pages (login, register)
├── dashboard/              # Dashboard page
├── expenses/               # Expense management
├── debts/                  # Debt tracking
├── assets/                 # Asset management
├── members/                # Member management
├── houses/                 # House management
└── layout.tsx              # Main layout with navigation

components/
├── dashboard/              # Dashboard components
│   ├── Sidebar.tsx
│   ├── HouseSwitcher.tsx
│   └── UserProfile.tsx
├── ui/                     # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── money-display.tsx
│   └── status-badge.tsx
└── lib/
    └── supabase/           # Supabase client and utilities

supabase/
└── migrations/             # Database migrations
```

## Database Schema

Main tables:
- `profiles` - User profiles
- `houses` - House records
- `house_members` - House membership
- `expenses` - Expense tracking
- `expense_splits` - Expense participant splits
- `debts` - Debt tracking
- `payments` - Payment history
- `assets` - Asset management
- `settlements` - Debt settlements

## Security

- Row Level Security (RLS) on all tables
- Strict house-level data isolation
- Server-side validation for all financial calculations

## Configuration

### Supabase

Configure Row Level Security (RLS) policies in the Supabase SQL Editor. The migration file includes comprehensive RLS policies.

## Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## Development

### Run TypeScript Checks

```bash
npx tsc --noEmit
```

### Run Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

## License

MIT
