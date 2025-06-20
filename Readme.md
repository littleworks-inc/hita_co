# 🚀 Hita&Co eCommerce Platform

A modern, full-stack eCommerce platform built with Next.js 14, TypeScript, and PostgreSQL.

## ✨ Features (Milestone 1)

- 🔐 **Secure Admin Authentication** - JWT-based login system
- 📊 **Modern Admin Dashboard** - Real-time stats and analytics
- 🎨 **Professional UI** - Built with Tailwind CSS and Shadcn/UI
- 🗄️ **PostgreSQL Database** - Robust data storage with Prisma ORM
- 🛡️ **Route Protection** - Secure admin-only areas
- 📱 **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with secure httpOnly cookies
- **UI Components**: Radix UI + Shadcn/UI

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Clone and Install

```bash
# Create project directory
mkdir hita-co-ecommerce
cd hita-co-ecommerce

# Initialize the project
npm init -y

# Install dependencies (copy package.json content first)
npm install
```

### 2. Environment Setup

Create `.env` file in root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hitaco_db"

# Authentication  
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Admin Setup
ADMIN_EMAIL="thehitanco@gmail.com"
ADMIN_PASSWORD="your-secure-password"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed initial data (admin user, categories, sample products)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/admin/login` and login with:
- **Email**: thehitanco@gmail.com  
- **Password**: your-secure-password

## 📁 Project Structure

```
hita-co-ecommerce/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── login/         # Login page
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication endpoints
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── admin/             # Admin-specific components
│   │   └── ui/                # UI components
│   ├── lib/                   # Utilities and configurations
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── db.ts              # Database client
│   │   └── utils.ts           # Utility functions
│   └── middleware.ts          # Route protection
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeder
├── public/                    # Static assets
└── config files...
```

## 🎯 What's Working Now

✅ **Admin Authentication** - Secure login/logout  
✅ **Admin Dashboard** - Overview with stats  
✅ **Database Schema** - Complete data structure  
✅ **Navigation** - Responsive admin navigation  
✅ **Route Protection** - Middleware security  
✅ **Sample Data** - Categories and sample products  

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database
npm run db:generate     # Generate Prisma client

# Code Quality
npm run lint            # Run ESLint
```

## 🐛 Troubleshooting

**Database Connection Issues:**
```bash
# Check PostgreSQL is running
psql --version

# Create database manually if needed
createdb hitaco_db
```

**Authentication Problems:**
```bash
# Clear cookies and try again
# Check JWT_SECRET in .env file
# Verify admin user exists: npm run db:studio
```

**Missing Dependencies:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 🔐 Security Features

- JWT tokens stored in httpOnly cookies
- Password hashing with bcrypt
- Route-level authentication middleware
- SQL injection protection via Prisma
- XSS protection via Next.js

## 🎨 Customization

The platform is designed to be easily customizable:

- **Colors**: Modify Tailwind config and CSS variables
- **Branding**: Update logo and store name in settings
- **Layout**: Modify components in `/components/admin/`

## 🚀 Next Steps (Upcoming Milestones)

- **Milestone 2**: Product Management with categories and inventory
- **Milestone 3**: Customer portal and shopping cart
- **Milestone 4**: AI integration and content generation
- **Milestone 5**: Exhibition management and analytics
- **Milestone 6**: Social media tools and deployment

## 🤝 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check the browser console for any JavaScript errors

---

**🎉 Congratulations!** You now have a working admin panel for Hita&Co. The foundation is solid and ready for the next features!