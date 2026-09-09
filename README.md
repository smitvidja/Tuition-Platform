# SR Classes

A comprehensive **School/Class Management System** built with Next.js and Supabase. Provides integrated dashboards and role-based access for different stakeholders in the education ecosystem.

---

## User Roles & Responsibilities

| Role | Responsibilities | Access |
|------|------------------|--------|
| **Faculty/Teacher** | Manage classes, track student progress, communicate with parents, assign grades | Faculty Dashboard |
| **Parent/Guardian** | Monitor child's performance, view reports, communicate with faculty | Parent Portal |
| **Admin/Owner** | Manage all users, system configuration, view analytics, manage permissions | Owner Dashboard |
| **Student** | View assignments, track progress, access learning materials | Student Dashboard (if applicable) |

---

## Features

- **Role-Based Dashboards** - Customized interface for each user type
- **Student Management** - Add, edit, and track student information
- **Faculty Management** - Create and manage teacher accounts
- **Progress Tracking** - Monitor academic performance and grades
- **User Administration** - Create, update, and remove user accounts
- **Access Control** - Secure role-based permission system
- **Responsive Design** - Works seamlessly on all devices

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ with TypeScript & Tailwind CSS |
| **Backend** | Supabase (serverless) |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth with role-based access |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├──────────────────┬──────────────────┬──────────────────────┤
│  Faculty         │  Parent Portal   │  Admin/Owner         │
│  Dashboard       │  Dashboard       │  Dashboard           │
│  /faculty        │  /parent         │  /owner              │
└──────────────────┴──────────────────┴──────────────────────┘
                            ↓
                   ┌─────────────────┐
                   │   API ROUTES    │
                   ├─────────────────┤
                   │ add-student     │
                   │ add-assistant   │
                   │ delete-user     │
                   └─────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                         │
├─────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization                           │
│  • API Routes & Business Logic                             │
│  • PostgreSQL Database                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/
│   ├── api/                          API route handlers
│   │   ├── add-student/              POST - Create student account
│   │   ├── add-assistant/            POST - Create faculty account
│   │   └── delete-user/              DELETE - Remove user
│   ├── faculty/dashboard/            Faculty management interface
│   ├── owner/dashboard/              Admin management interface
│   ├── parent/dashboard/             Parent portal interface
│   ├── layout.tsx                    Root layout component
│   └── page.tsx                      Home page
├── lib/
│   ├── supabase.ts                   Client-side Supabase config
│   └── supabase-admin.ts             Server-side admin config
└── components/                       Reusable React components

supabase/
└── migrations/                       Database schema & migrations
```

---

## API Reference

### User Management Endpoints

| Method | Endpoint | Purpose | Body |
|--------|----------|---------|------|
| `POST` | `/api/add-student` | Create new student account | Student details |
| `POST` | `/api/add-assistant` | Create faculty/assistant account | Faculty details |
| `DELETE` | `/api/delete-user` | Remove user from system | User ID |

---

## Database

The system uses PostgreSQL through Supabase with versioned migrations located in `supabase/migrations/`. Database schema includes tables for:
- Users & Authentication
- Students & Enrollment
- Faculty & Assignments
- Progress & Grades
- Communication/Messaging

---

This is a [Next.js](https://nextjs.org) project. For more information, refer to the [Next.js Documentation](https://nextjs.org/docs) and [Supabase Documentation](https://supabase.com/docs).
