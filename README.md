# 🎓 SR Classes — Tuition Management Platform

<div align="center">

![SR Classes](https://img.shields.io/badge/SR%20Classes-Ahmedabad-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?style=for-the-badge&logo=vercel)

**A full-stack web platform for SR Classes — a coaching institute in Ahmedabad serving 500+ students across Classes 6–12, B.Com & BBA.**

[🌐 Live Demo](https://tuition-platform-nine.vercel.app) · [📋 Report Bug](https://github.com/smitvidja/Tuition-Platform/issues) · [✨ Request Feature](https://github.com/smitvidja/Tuition-Platform/issues)

</div>

---

## 📌 Overview

SR Classes is a real-world, production-deployed coaching institute platform built with the modern Next.js App Router architecture. It combines a public-facing marketing website with a secure student/parent portal backed by Supabase — giving students, parents, and administrators a single digital interface for all academic interactions.

> **8+ years of excellence · 500+ students · 100% Board Results · CBSE · GSEB · ICSE**

---

## ✨ Features

### 🏠 Public Website
- **Hero Section** — Animated marquee ticker with live announcements (open admissions, free demo classes)
- **Topper Showcase** — Highlights top-performing students with subject-wise marks
- **Board & Curriculum Coverage** — CBSE, GSEB, ICSE (Classes 6–12), B.Com, BBA
- **Why Us Section** — Result-oriented teaching philosophy, faculty credentials, assessment cadence
- **Enrollment CTA** — Direct "Enroll Now" flow with contact integration
- **Responsive Design** — Mobile-first layout for parents on the go

### 🔐 Student & Parent Portal
- **Secure Authentication** — Email/password login powered by Supabase Auth
- **Attendance Records** — 24/7 access to live attendance data
- **Study Materials** — Digital access to notes, assignments, and resources
- **Parent Communication** — Transparent progress updates for parents
- **Role-Based Access** — Separate views and permissions for students and parents

### ⚙️ Admin & Operations
- **Supabase Backend** — PostgreSQL database with Row Level Security (RLS)
- **Analytics** — Vercel Analytics integration for traffic and engagement tracking
- **Setup Guide** — Dedicated `SR_Classes_Setup_Guide.docx` for onboarding new administrators

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16.2](https://nextjs.org/) (App Router) |
| UI Library | [React 19.2](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Backend / Auth / DB | [Supabase](https://supabase.com/) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| Linting | ESLint (next/recommended) |
| Deployment | [Vercel](https://vercel.com/) |

---

## 📁 Project Structure

```
Tuition-Platform/
├── public/                     # Static assets (images, icons, fonts)
├── src/
│   └── app/                    # Next.js App Router
│       ├── layout.tsx          # Root layout with global providers
│       ├── page.tsx            # Landing page (hero, boards, why-us, contact)
│       ├── login/              # Authentication flow
│       └── portal/             # Protected student/parent dashboard
├── .gitignore
├── eslint.config.mjs
├── next.config.ts              # Next.js configuration
├── package.json
├── tsconfig.json
└── SR_Classes_Setup_Guide.docx # Admin onboarding guide
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) / yarn / pnpm / bun
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/smitvidja/Tuition-Platform.git
cd Tuition-Platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> ⚠️ **Never commit `.env.local` to version control.** It is already in `.gitignore`. The Service Role Key bypasses all Row Level Security — treat it like a database root password.

You can find these values in your Supabase dashboard under **Settings → API**.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe to expose in client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server-side only**, never expose to client |

---

## 🗄️ Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Set up the required tables (refer to `SR_Classes_Setup_Guide.docx` in the repo root for the full schema and RLS policy setup)
3. Enable **Email Auth** under Authentication → Providers
4. Configure **Row Level Security (RLS)** on all tables before going live

---

## 📦 Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## 🌐 Deployment

This project is deployed on **Vercel** with zero-config Next.js support.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/smitvidja/Tuition-Platform)

1. Connect your GitHub repo to Vercel
2. Add the three environment variables in **Vercel → Settings → Environment Variables**
3. Vercel handles builds automatically on every push to `main`

---

## 📸 Screenshots

| Page | Preview |
|---|---|
| Landing Page | *(Add screenshot)* |
| Student Portal | *(Add screenshot)* |
| Login | *(Add screenshot)* |

> Tip: Use [Screely](https://screely.com/) or [shots.so](https://shots.so/) to create beautiful browser-framed screenshots for this section.

---

## 🏫 About SR Classes

**SR Classes** is a trusted coaching institute in **Sardarnagar, Ahmedabad**, offering expert academic coaching for students from Class 6 through 12 across all major boards (CBSE, GSEB, ICSE) as well as undergraduate commerce programmes (B.Com, BBA).

- 📍 **Location:** Sardarnagar, Ahmedabad, Gujarat
- 📞 **Phone:** +91 8200718732 / +91 9016385211
- ✉️ **Email:** piyush.ganwani@gmail.com
- 🌐 **Website:** [tuition-platform-nine.vercel.app](https://tuition-platform-nine.vercel.app)

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and built for SR Classes, Ahmedabad. All rights reserved © 2026 SR Classes.

---

<div align="center">
Built by <a href="https://github.com/smitvidja">Smit Vidja</a> & <a href="https://github.com/Niraj3112">Niraj Lalu</a>
</div>
