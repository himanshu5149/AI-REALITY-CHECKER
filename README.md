# AI Reality Checker 🔪

A brutal startup idea analyst trained on the graveyard of 500,000+ failed ventures. Get the truth before you waste a single dollar.

## Features

- **Brutal Analysis**: Get uncompromising honesty about your startup idea.
- **Survival Score**: A calculated probability of your startup existing in 3 years.
- **Supabase Integration**: Persistent history of all audits.
- **Viral Share Lines**: Optimized text for sharing your "roast" on social media.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Motion
- **AI**: Gemini 3.1 Pro (via `@google/genai`)
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Setup

1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your `GEMINI_API_KEY`
   - Add your Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. **Database Setup**:
   Run the following SQL in your Supabase SQL Editor:
   ```sql
   create table audits (
     id uuid default gen_random_uuid() primary key,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     idea text not null,
     mode text not null,
     analysis jsonb not null
   );
   ```
5. **Run development server**: `npm run dev`

## Deployment

This app is designed to be deployed to Cloud Run via AI Studio Build, but can be hosted on any platform supporting static Vite builds (Vercel, Netlify, etc.) if the Gemini API calls are proxied or handled securely.
