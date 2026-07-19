# CLAUDE.md - AI Assistant Guide for Hita&Co eCommerce Platform

> **Last Updated**: 2026-07-18
> **Platform Version**: 1.0.0
> **Completion**: 96% (payment gateway decision pending)

This document provides comprehensive guidance for AI assistants working on the Hita&Co eCommerce platform. It covers architecture, conventions, workflows, and best practices.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Development Workflows](#development-workflows)
6. [Key Conventions](#key-conventions)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [Authentication & Security](#authentication--security)
10. [State Management](#state-management)
11. [Testing Guidelines](#testing-guidelines)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)
    - [TypeScript Errors](#typescript-errors)
    - [Barcode Issues](#barcode-issues)
14. [Critical Files](#critical-files)

---

## Project Overview

**Hita&Co** is a sophisticated full-stack eCommerce platform built for LittleWorks Inc, featuring:

- 🛒 **Complete eCommerce System**: Product catalog, cart, checkout, orders
- 👨‍💼 **Admin Management**: Comprehensive admin panel for all operations
- 💱 **Multi-Currency Support**: 15 currencies with live exchange rates
- 🏛️ **Exhibition POS System**: Track products taken to exhibitions, sales tracking
- 📊 **Advanced Analytics**: Business insights and reporting
- 🤖 **AI Integration**: Content generation for products (OpenAI, Gemini, Anthropic)
- 📦 **Size Variant System**: Flexible size management with individual SKUs and barcodes
- 🔐 **Enterprise Security**: JWT authentication, middleware protection
- 📱 **Mobile Responsive**: Works seamlessly across all devices

**Current Status**: 96% complete, ready for payment integration and catalog/eCommerce toggle

---

## Tech Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 14.2.31 | App Router, SSR, API routes |
| **Language** | TypeScript | 5.3.3 | Type safety, better DX |
| **Database** | PostgreSQL | Latest | Primary data store |
| **ORM** | Prisma | 5.7.0 | Type-safe database access |
| **Styling** | Tailwind CSS | 3.4.0 | Utility-first CSS |
| **UI Components** | Radix UI + Shadcn/UI | Latest | Accessible components |
| **Authentication** | JWT (jose) | 5.1.3 | Secure auth with httpOnly cookies |
| **Charts** | Recharts | 2.15.4 | Data visualization |
| **Icons** | Lucide React | 0.303.0 | Icon system |

### Key Dependencies

```json
{
  "@prisma/client": "^5.7.0",
  "@radix-ui/react-*": "Multiple components",
  "bcryptjs": "^2.4.3",
  "jose": "^5.1.3",
  "next": "^14.2.31",
  "react": "^18.2.0",
  "recharts": "^2.15.4"
}
```

### Node.js Requirements

- **Node.js**: 18+ (specified in package.json engines field)
- **npm**: Latest stable version

---

## Project Structure

```
hita_co/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Database seeding script
├── public/                    # Static assets
│   └── hita-logo.png         # Brand logo
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/            # Admin panel pages
│   │   │   ├── analytics/
│   │   │   ├── categories/
│   │   │   ├── currency/
│   │   │   ├── customers/
│   │   │   ├── dashboard/
│   │   │   ├── exhibitions/
│   │   │   ├── hero-slides/
│   │   │   ├── login/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── settings/
│   │   │   ├── shipping/
│   │   │   ├── social/
│   │   │   └── suppliers/
│   │   ├── api/              # API Routes
│   │   │   ├── admin/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   ├── barcode/
│   │   │   ├── categories/
│   │   │   ├── contact/
│   │   │   ├── currency/
│   │   │   ├── customer/
│   │   │   ├── exhibition/
│   │   │   ├── hero-slides/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── shipping/
│   │   ├── cart/             # Shopping cart page
│   │   ├── categories/       # Category pages
│   │   ├── checkout/         # Checkout flow
│   │   ├── contact/          # Contact page
│   │   ├── exhibition/       # Exhibition POS system
│   │   ├── products/         # Product pages
│   │   ├── privacy-policy/   # Privacy policy page
│   │   ├── returns/          # Returns & exchanges policy (driven by admin return settings)
│   │   ├── shipping-policy/  # Shipping policy (pulls live shipping zone rates)
│   │   ├── size-guide/       # Indian-to-US size conversion charts
│   │   ├── terms/            # Terms of service
│   │   ├── layout.tsx        # Root layout (renders SiteFooter via ConditionalLayoutWrapper)
│   │   └── page.tsx          # Homepage
│   ├── components/           # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── cart/            # Cart components
│   │   ├── checkout/        # Checkout components
│   │   ├── customer/        # Customer portal components
│   │   ├── exhibition/      # Exhibition components
│   │   ├── stock/           # Stock management components
│   │   └── ui/              # Shadcn/UI components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── ai/             # AI service utilities
│   │   ├── ai-services.ts  # AI provider integrations
│   │   ├── auth.ts         # Authentication helpers
│   │   ├── barcode-utils.ts # Barcode generation
│   │   ├── currency.ts     # Currency conversion
│   │   ├── db.ts           # Database client & utilities
│   │   ├── discount-utils.ts # Discount calculations
│   │   ├── seo.ts          # SEO utilities
│   │   ├── shipping-utils.ts # Shipping calculations
│   │   ├── stock-sync.ts   # Stock synchronization
│   │   ├── store-settings.ts # Shared store settings fetcher for customer pages
│   │   └── utils.ts        # General utilities
│   └── types/              # TypeScript type definitions
├── styles/                  # Global styles
├── .env.example            # Environment variables template
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies & scripts
├── Readme.md               # Project README
└── roadmap.md              # Development roadmap

```

---

## Architecture & Design Patterns

### 1. **Next.js App Router Architecture**

- **Server Components**: Default for all pages (better performance)
- **Client Components**: Only when needed (interactive elements, hooks)
- **Route Groups**: Used for auth protection (e.g., `exhibition/(authenticated)`)
- **API Routes**: RESTful endpoints in `src/app/api/`
- **Middleware**: Route protection at `src/middleware.ts`

### 2. **Database Layer (Prisma)**

- **Prisma Client**: Singleton pattern in `src/lib/db.ts`
- **Connection Pooling**: Configured for serverless environments
- **Type Safety**: Generated types from schema
- **Migrations**: Use `prisma migrate dev` for schema changes
- **Seeding**: Automated via `npm run db:seed`

### 3. **Authentication Pattern**

```typescript
// JWT stored in httpOnly cookies
// Middleware checks session on protected routes
// Admin routes: /admin/*
// Exhibition routes: /exhibition/*
```

### 4. **Component Organization**

- **Atomic Design Principles**: UI components are composable
- **Feature-based**: Admin/customer/exhibition components separated
- **Shadcn/UI Pattern**: Copy-paste components, modify as needed

### 4.5 **Customer Pages, Footer & Brand Voice**

- **Site footer**: `src/components/customer/SiteFooter.tsx` is a server component passed
  into `ConditionalLayoutWrapper` via its `footer` prop from `layout.tsx`. It renders only
  on customer-facing routes (not admin/exhibition/login).
- **Policy & help pages**: `/shipping-policy`, `/returns`, `/privacy-policy`, `/terms`,
  `/size-guide` all use `src/components/customer/PolicyPageShell.tsx` (nav + header +
  prose container). New static/help pages should reuse this shell.
- **Store settings**: use `getCustomerStoreSettings()` from `src/lib/store-settings.ts`
  on customer pages instead of duplicating a local `getStoreSettings()`. Returns page
  content is driven by admin return settings (`returnsEnabled`, `returnPeriodDays`, etc.);
  shipping policy pulls live rates from `ShippingZone`/`ShippingRate`.
- **Brand voice**: Hita&Co sells Indian women's ethnic wear (kurtas, sets, festive wear)
  to customers in the USA. Copy should reflect that — not generic "artisan products" or
  template text. Fallback store name is `Hita&Co`, never `LittleWorks Inc`.
- **No unverifiable claims**: do not add marketing claims the business can't back up
  (e.g., "free worldwide shipping", "24/7 support", "trusted by thousands", payment
  security claims while no gateway is integrated). Prefer claims backed by settings/data
  or link to the policy pages.

### 5. **State Management**

- **Server State**: React Server Components (default)
- **Client State**: React hooks (useState, useEffect)
- **URL State**: Next.js router for navigation state
- **No Global State Library**: Keep it simple with React context where needed

---

## Development Workflows

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# 3. Generate Prisma client
npx prisma generate

# 4. Push database schema
npx prisma db push

# 5. Seed database (creates admin user, categories, sample products)
npm run db:seed

# 6. Start development server
npm run dev
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database (no migration)
npm run db:migrate       # Create migration and apply
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:seed          # Seed database
npm run db:reset         # Reset database (caution!)
npm run test:db          # Test database connection
npm run check:connections # Check database status

# Build Variants
npm run build:optimized  # Optimized production build
npm run build:static     # Static export build
npm run build:debug      # Debug build with Prisma logs
```

### Git Workflow

```bash
# Feature development
git checkout -b claude/feature-name-sessionid
git add .
git commit -m "feat: descriptive message"
git push -u origin claude/feature-name-sessionid

# Pull request
gh pr create --title "Feature: Title" --body "Description"
```

**Important**: All Claude development branches should start with `claude/` and end with the session ID.

---

## Key Conventions

### 1. **Naming Conventions**

#### Files & Folders
- **React Components**: PascalCase (`ProductCard.tsx`, `AdminLayout.tsx`)
- **Utilities**: camelCase (`auth.ts`, `currency.ts`)
- **API Routes**: kebab-case folders (`hero-slides/`, `ai-tools/`)
- **Page Files**: lowercase (`page.tsx`, `layout.tsx`)

#### Code
- **Components**: PascalCase (`function ProductCard()`)
- **Functions**: camelCase (`function calculateTotal()`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_ITEMS = 100`)
- **Types/Interfaces**: PascalCase (`interface Product`, `type OrderStatus`)
- **Database Models**: PascalCase (`model Product`, `model Order`)

### 2. **TypeScript Conventions**

- **Always use TypeScript**: No `.js` or `.jsx` files
- **Explicit Types**: Prefer explicit types over `any`
- **Prisma Types**: Import from `@prisma/client`
- **Props Interfaces**: Define for all components

```typescript
// Good
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // ...
}
```

### 3. **Prisma Conventions**

- **Model Names**: Singular PascalCase (`Product`, not `Products`)
- **Table Names**: Plural snake_case via `@@map("products")`
- **Relations**: Named clearly (`category Category`, `orderItems OrderItem[]`)
- **IDs**: Use `@default(cuid())` for unique identifiers
- **Timestamps**: Always include `createdAt` and `updatedAt`

### 4. **API Route Conventions**

- **RESTful**: GET/POST/PUT/DELETE methods
- **Response Format**: Consistent JSON structure

```typescript
// Success
{ success: true, data: {...}, message: "Success message" }

// Error
{ error: "Error message", details: {...} }
```

- **Status Codes**:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Server Error

### 5. **Styling Conventions**

- **Tailwind First**: Use utility classes
- **CSS Variables**: For theme colors (defined in `globals.css`)
- **Responsive**: Mobile-first approach
- **Dark Mode**: Support via `next-themes` and CSS variables

```tsx
// Good: Tailwind utilities
<div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">

// Avoid: Inline styles unless absolutely necessary
```

### 6. **Import Conventions**

```typescript
// 1. External dependencies
import { useState } from 'react';
import { Product } from '@prisma/client';

// 2. Internal absolute imports (using @/ alias)
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

// 3. Relative imports (only for co-located files)
import { ProductCard } from './ProductCard';
```

### 7. **Component Structure**

```typescript
// 1. Imports
import { ... } from '...'

// 2. Types/Interfaces
interface ComponentProps { ... }

// 3. Component Definition
export function Component({ props }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Derived state/calculations
  const total = useMemo(() => ...)

  // 6. Event handlers
  const handleClick = () => { ... }

  // 7. Effects
  useEffect(() => { ... }, [])

  // 8. Early returns
  if (loading) return <Loading />

  // 9. JSX
  return (
    <div>...</div>
  )
}
```

---

## Database Schema

### Core Models

#### **Product**
- Primary product information
- Pricing in USD (cost, selling price, profit margin)
- Multi-currency support via `Country` relation
- Stock management (`stockQuantity`, `lowStockAlert`)
- Size variant support (`requiresSizes` flag)
- Barcode generation support
- Status: `DRAFT`, `PUBLISHED`, `ARCHIVED`

#### **ProductSize**
- Size variants for products (S, M, L, XL, etc.)
- Individual SKUs and barcodes per size
- Independent stock tracking per size
- Critical: Stock sync between `Product.stockQuantity` and sum of `ProductSize.stockQuantity`

#### **Category**
- Hierarchical categories (parent/child)
- Category-specific defaults (`defaultRequiresSizes`)

#### **Country**
- Multi-currency support (15 currencies)
- Exchange rates
- Default GST/Tax percentages
- Shipping defaults

#### **Supplier**
- Supplier management
- Contact information
- Business details (GST, PAN, bank details)

#### **Order**
- Customer orders
- Source tracking: `ONLINE`, `EXHIBITION`, `MANUAL`
- Payment status and method
- Order status workflow

#### **Exhibition**
- Exhibition/event management
- Product tracking taken to exhibitions
- Sales tracking at exhibitions
- Exhibition-specific pricing and discounts

#### **ExhibitionSale**
- POS system for exhibitions
- Payment methods: `CASH`, `ZELLE`, `CARD`, `VENMO`, `PAYPAL`, `SPLIT_PAYMENT`
- Receipt tracking

### Key Relationships

```
Product
├── Category (many-to-one)
├── Country (many-to-one)
├── Supplier (many-to-one)
├── ProductSize[] (one-to-many) - Size variants
├── OrderItem[] (one-to-many)
├── CartItem[] (one-to-many)
├── ExhibitionProduct[] (one-to-many)
└── ExhibitionSaleItem[] (one-to-many)

Exhibition
├── ExhibitionProduct[] (one-to-many)
├── ExhibitionSale[] (one-to-many)
└── Order[] (one-to-many)
```

### Critical Database Notes

1. **Stock Synchronization**: Always sync `Product.stockQuantity` with sum of `ProductSize.stockQuantity` when using size variants. Use `/src/lib/stock-sync.ts` utilities.

2. **Cascade Deletes**: Configured for related data (e.g., deleting Product deletes ProductSize)

3. **Unique Constraints**:
   - Product SKU and barcode must be unique
   - ProductSize SKU and barcode must be unique
   - Category slug must be unique

---

## API Routes

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify session

### Products

- `GET /api/products` - List products (with filters)
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/products/[id]/sizes` - Add size variant
- `PUT /api/products/[id]/publish` - Publish product

### Categories

- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Orders

- `GET /api/orders` - List orders
- `GET /api/orders/[id]` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order status

### Currency

- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert currency

### Exhibition

- `GET /api/exhibition` - List exhibitions
- `POST /api/exhibition` - Create exhibition
- `POST /api/exhibition/[id]/add-products` - Add products to exhibition
- `POST /api/exhibition/[id]/sale` - Create exhibition sale

### AI

- `POST /api/ai/generate` - Generate AI content
- `GET /api/ai/providers` - List available AI providers

---

## Authentication & Security

### JWT Authentication

**Implementation**: `src/lib/auth.ts`

```typescript
// Create JWT token
const token = await createJWT({ userId, email, role });

// Verify JWT token
const payload = await verifyJWT(token);

// Set httpOnly cookie
cookies().set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

### Middleware Protection

**File**: `src/middleware.ts`

Protected Routes:
- `/admin/*` - Requires admin session
- `/exhibition/*` - Requires exhibition session (except `/exhibition/login`)

Public Routes:
- `/` - Homepage
- `/products/*` - Product pages
- `/categories/*` - Category pages
- `/cart` - Shopping cart
- `/checkout` - Checkout (session-based)

### Security Best Practices

1. **Passwords**: Hashed with bcryptjs (12 rounds)
2. **Cookies**: httpOnly, secure in production
3. **SQL Injection**: Protected by Prisma (parameterized queries)
4. **XSS**: Protected by Next.js (automatic escaping)
5. **CSRF**: SameSite cookie policy
6. **Secrets**: All secrets in `.env`, never committed

---

## State Management

### Server Components (Default)

```tsx
// Fetch data directly in Server Component
async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true, productSizes: true }
  });

  return <ProductDetail product={product} />;
}
```

### Client Components

```tsx
'use client'

// Only mark as client when needed
function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    // ... cart logic
  };

  return <Button onClick={handleAddToCart} loading={loading}>Add to Cart</Button>;
}
```

### Cart State

Currently session-based with database persistence (`CartItem` model). Consider implementing:
- Local storage for guest users
- Server actions for mutations
- Optimistic updates for better UX

---

## Testing Guidelines

### Manual Testing Checklist

Before committing changes:

1. **Admin Panel**
   - [ ] Login works
   - [ ] CRUD operations function
   - [ ] Data validates correctly
   - [ ] No console errors

2. **Customer Portal**
   - [ ] Products display correctly
   - [ ] Cart functionality works
   - [ ] Checkout flow completes
   - [ ] Multi-currency works

3. **Exhibition System**
   - [ ] Exhibition login works
   - [ ] Products can be added
   - [ ] Sales can be recorded
   - [ ] Stock syncs correctly

4. **Database**
   - [ ] Migrations apply cleanly
   - [ ] Seed script works
   - [ ] No orphaned data

### Testing Database Changes

```bash
# 1. Test on clean database
npm run db:reset
npm run db:seed

# 2. Verify schema
npx prisma studio

# 3. Test migrations
npm run db:migrate
```

---

## Common Tasks

### Adding a New Product Field

1. **Update Prisma Schema** (`prisma/schema.prisma`)
```prisma
model Product {
  // ... existing fields
  newField String? // Add your field
}
```

2. **Generate Prisma Client**
```bash
npm run db:generate
npm run db:push
```

3. **Update API Routes** (e.g., `src/app/api/products/route.ts`)
```typescript
// Add field to validation and creation logic
```

4. **Update UI Components** (e.g., `src/components/admin/ProductForm.tsx`)
```tsx
// Add form field
<Input name="newField" ... />
```

### Creating a New API Route

1. **Create Route File** (`src/app/api/my-route/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    const data = await prisma.model.findMany();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error message'
    }, { status: 500 });
  }
}
```

### Adding a New Admin Page

1. **Create Page** (`src/app/admin/my-page/page.tsx`)
2. **Add Navigation** (`src/components/admin/AdminNav.tsx`)
3. **Create Components** (`src/components/admin/MyPageComponent.tsx`)
4. **Add API Routes** if needed

### Currency Conversion

```typescript
import { convertPrice, getExchangeRates } from '@/lib/currency';

// Convert USD to target currency
const convertedPrice = await convertPrice(100, 'USD', 'EUR');

// Get all exchange rates
const rates = await getExchangeRates();
```

### Stock Synchronization

```typescript
import { syncProductStock } from '@/lib/stock-sync';

// Sync main product stock with size variants
await syncProductStock(productId);
```

### Barcode Generation

```typescript
import { generateBarcode } from '@/lib/barcode-utils';

// Generate barcode for product or size
const barcode = generateBarcode({
  prefix: 'HC',
  productSku: 'KURTA-001',
  size: 'M' // optional
});
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npm run test:db

# Check connection status
npm run check:connections

# If Prisma client is out of sync
npm run db:generate

# If schema changes not applied
npm run db:push
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate

# Try build again
npm run build
```

### Authentication Issues

```bash
# Check JWT_SECRET is set in .env
echo $JWT_SECRET

# Clear browser cookies
# Check session token in browser DevTools > Application > Cookies

# Verify admin user exists
npm run db:studio
# Check users table
```

### Stock Not Showing

```bash
# Run stock sync utility
# See src/lib/stock-sync.ts

# Check product status
npx prisma studio
# Verify product status is PUBLISHED
# Verify stockQuantity > 0 or productSizes have stock
```

### Middleware Redirect Loops

Check `src/middleware.ts`:
- Ensure login pages are excluded from auth checks
- Verify cookie names match between auth and middleware
- Check matcher config excludes static files

### TypeScript Errors

#### Understanding TypeScript Errors in Next.js

**Important**: Running `npx tsc --noEmit` may show errors that don't affect the build. Next.js handles TypeScript differently.

**Common False Positives:**

```bash
# These errors often appear with raw tsc but don't break Next.js builds:
# - JSX element implicitly has type 'any'
# - Cannot find module 'next/...' or its corresponding type declarations
# - Cannot find name 'process' (in seed.ts or other non-src files)
```

**Solution: Always test with Next.js build:**

```bash
# Instead of running tsc directly, use:
npm run build

# This uses Next.js's TypeScript handling which is more accurate
```

#### Common TypeScript Issues & Fixes

**1. Prisma Client Not Found**

```bash
# Error: Cannot find module '@prisma/client'
# Fix:
npm run db:generate
```

**2. Missing Type Definitions**

```bash
# Error: Cannot find name 'process'. Try `npm i --save-dev @types/node`
# Fix: Already installed, but if needed:
npm install --save-dev @types/node
```

**3. Type Errors in Components**

```typescript
// ❌ Bad: Implicit any
function MyComponent({ data }) { ... }

// ✅ Good: Explicit types
interface MyComponentProps {
  data: Product;
}
function MyComponent({ data }: MyComponentProps) { ... }
```

**4. Prisma Type Imports**

```typescript
// ✅ Always import types from @prisma/client
import { Product, Category, Order } from '@prisma/client';

// ✅ Use Prisma's generated types for relations
import type { Product as PrismaProduct } from '@prisma/client';
type ProductWithCategory = PrismaProduct & {
  category: { name: string };
};
```

**5. Client vs Server Component Types**

```typescript
// ❌ Bad: Using server-only features in client components
'use client'
import { prisma } from '@/lib/db'; // Error: Can't use Prisma in client

// ✅ Good: Fetch data via API in client components
'use client'
const fetchData = async () => {
  const res = await fetch('/api/products');
  return res.json();
};
```

### Barcode Issues

The platform uses **CODE128** barcode format exclusively with custom canvas-based generation.

#### Common Barcode Problems & Solutions

**1. Barcode Not Generating**

```typescript
// Issue: Barcode field is empty or null
// Check: src/lib/barcode-utils.ts

// Solution 1: Auto-generate from SKU
import { generateBarcodeFromSKU } from '@/lib/barcode-utils';
const barcode = generateBarcodeFromSKU(product.sku);

// Solution 2: Use SKU as fallback
const displayBarcode = product.barcode || product.sku;
```

**2. Barcode Validation Errors**

```typescript
// Common validation errors:

// ❌ Too Long (>80 characters)
const barcode = 'VERY-LONG-SKU-WITH-MANY-CHARACTERS-THAT-EXCEEDS-CODE128-LIMIT-OF-80';
// Fix: Truncate or use shorter format

// ❌ Invalid Characters (non-ASCII)
const barcode = 'PRODUCT-™-SKU'; // ™ is > ASCII 127
// Fix: Remove special characters

// ✅ Valid CODE128
import { validateBarcodeFormat } from '@/lib/barcode-utils';
const validation = validateBarcodeFormat(barcode);
if (!validation.isValid) {
  console.error(validation.error);
}
```

**3. Size Variant Barcode Issues**

```typescript
// Issue: Size variants not getting unique barcodes

// Solution: Use size-specific SKU generation
// Pattern: BASE-SKU + SIZE (e.g., "KURTA-001-M", "KURTA-001-L")

// In src/lib/barcode-utils.ts:
import { generateSizeBarcodes } from '@/lib/barcode-utils';

const sizeBarcodes = generateSizeBarcodes(
  'KURTA-001',
  ['S', 'M', 'L', 'XL']
);
// Result: {
//   S: 'KURTA-001-S',
//   M: 'KURTA-001-M',
//   L: 'KURTA-001-L',
//   XL: 'KURTA-001-XL'
// }
```

**4. Barcode Lookup Not Finding Products**

```typescript
// Issue: Scanned barcode doesn't match database

// Check 1: Barcode case sensitivity
// Barcodes are stored and searched in UPPERCASE
const cleanBarcode = scannedBarcode.trim().toUpperCase();

// Check 2: Check both Product and ProductSize tables
import { lookupBarcode } from '@/lib/barcode-lookup';
const result = await lookupBarcode(scannedBarcode);

if (result.type === 'main_product') {
  // Found main product
} else if (result.type === 'size_variant') {
  // Found size variant
} else {
  // Not found - check if barcode exists in database
}
```

**5. Canvas Rendering Issues**

```typescript
// Issue: Barcode not rendering in browser

// Solution: Ensure component is client-side
'use client' // Add this at the top

// Solution: Check canvas ref is initialized
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  if (!canvasRef.current) return; // Wait for mount

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Generate barcode...
}, [barcode]);
```

**6. Barcode Printing Issues**

```typescript
// Issue: Print dialog shows blank page

// Check 1: Ensure barcode is generated before printing
await generateBarcode(); // Wait for generation
setTimeout(() => window.print(), 100); // Small delay

// Check 2: Print-specific CSS
// In your component styles or globals.css:
/*
@media print {
  body * {
    visibility: hidden;
  }
  #barcode-container,
  #barcode-container * {
    visibility: visible;
  }
  #barcode-container {
    position: absolute;
    left: 0;
    top: 0;
  }
}
*/
```

**7. Barcode Uniqueness Conflicts**

```bash
# Error: Unique constraint failed on barcode field

# Issue: Duplicate barcode in database
# Check duplicates:
npx prisma studio
# Search in Product and ProductSize tables

# Solution: Auto-append timestamp for uniqueness
const uniqueBarcode = `${baseSKU}-${Date.now().toString().slice(-6)}`;
```

#### Barcode Best Practices

```typescript
// 1. Always validate before saving
import { validateBarcodeFormat } from '@/lib/barcode-utils';
const validation = validateBarcodeFormat(barcode);
if (!validation.isValid) {
  throw new Error(validation.error);
}

// 2. Handle missing barcodes gracefully
const effectiveBarcode = product.barcode || product.sku;

// 3. For size variants, always use parent SKU + size
const sizeVariantBarcode = `${product.sku}-${size.toUpperCase()}`;

// 4. Store barcodes in UPPERCASE for consistency
const normalizedBarcode = barcode.trim().toUpperCase();

// 5. Check uniqueness before creating
const existing = await prisma.product.findUnique({
  where: { barcode: newBarcode }
});
if (existing) {
  throw new Error('Barcode already exists');
}
```

#### Barcode Debugging Checklist

- [ ] Is barcode field populated in database?
- [ ] Is barcode less than 80 characters?
- [ ] Does barcode contain only ASCII characters?
- [ ] Is barcode unique across Product and ProductSize tables?
- [ ] For size variants, does each size have unique barcode?
- [ ] Is barcode stored in UPPERCASE?
- [ ] Does canvas element exist when trying to render?
- [ ] Is component marked as 'use client' if using canvas?
- [ ] Does barcode match what's in the database (case-insensitive search)?

#### Key Barcode Files

| File | Purpose |
|------|---------|
| `src/lib/barcode-utils.ts` | Barcode generation and validation |
| `src/lib/barcode-lookup.ts` | Database lookup for scanned barcodes |
| `src/components/admin/BarcodeDisplay.tsx` | Display barcode with canvas |
| `src/components/admin/WorkingBarcodePrinter.tsx` | Print barcodes |
| `src/components/admin/AutoBarcodeGenerator.tsx` | Auto-generate on SKU change |

---

## Critical Files

### Must Understand

| File | Purpose | Critical Points |
|------|---------|----------------|
| `src/middleware.ts` | Route protection | Admin/exhibition auth, redirect logic |
| `src/lib/db.ts` | Database client | Singleton pattern, connection pooling |
| `src/lib/auth.ts` | Authentication | JWT creation/verification |
| `prisma/schema.prisma` | Database schema | All models, relationships, constraints |
| `src/lib/stock-sync.ts` | Stock management | Product ↔ ProductSize synchronization |
| `src/lib/currency.ts` | Currency system | Conversion, exchange rates |
| `src/lib/barcode-utils.ts` | Barcode generation | CODE128 validation, SKU-to-barcode |
| `src/lib/barcode-lookup.ts` | Barcode search | Find products by scanned barcode |
| `next.config.js` | Next.js config | Prisma externals, image domains |
| `.env.example` | Environment template | Required secrets, API keys |

### Frequently Modified

| File | Common Changes |
|------|---------------|
| `src/app/admin/*/page.tsx` | Admin UI updates |
| `src/app/api/*/route.ts` | API logic changes |
| `src/components/admin/*` | Admin components |
| `src/components/customer/*` | Customer portal |
| `prisma/schema.prisma` | Schema updates |
| `src/lib/*.ts` | Utility functions |

---

## Development Best Practices

### 1. **Always Test Locally First**

```bash
# Before pushing changes
npm run lint        # Check for linting errors
npm run build       # Ensure build succeeds
npm run db:push     # Apply database changes
```

### 2. **Database Changes Workflow**

```bash
# 1. Update schema
# Edit prisma/schema.prisma

# 2. Generate client
npm run db:generate

# 3. Apply changes (development)
npm run db:push

# 4. Create migration (production)
npm run db:migrate
```

### 3. **Component Development**

- Start with Server Components
- Only use Client Components when necessary
- Keep components focused and single-purpose
- Use TypeScript for all props

### 4. **API Route Development**

- Always validate input data
- Return consistent JSON structure
- Handle errors gracefully
- Use appropriate HTTP status codes
- Log errors for debugging

### 5. **Commit Messages**

Use conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### 6. **Code Review Checklist**

- [ ] TypeScript types are correct
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Database queries optimized
- [ ] UI is responsive
- [ ] Accessibility considered
- [ ] No security vulnerabilities

---

## Performance Considerations

### 1. **Database Queries**

```typescript
// ✅ Good: Include only needed relations
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    productSizes: true
  }
});

// ❌ Bad: Fetching unnecessary data
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    productSizes: true,
    orderItems: true,  // Not needed
    cartItems: true    // Not needed
  }
});
```

### 2. **Image Optimization**

```tsx
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={false}
/>
```

### 3. **Server vs Client Components**

- Default to Server Components
- Use Client Components only for interactivity
- Minimize client-side JavaScript bundle

---

## Deployment Notes

### Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="long-random-secret"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# Optional AI APIs
OPENAI_API_KEY=""
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# App Configuration
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Build Configuration

**Next.js Config** (`next.config.js`):
- Prisma externalized for serverless
- Image domains whitelisted
- Output: standalone (for Docker/serverless)

### Database Migration Strategy

```bash
# Development: Push schema
npm run db:push

# Production: Use migrations
npm run db:migrate
```

---

## Future Enhancements

Based on `roadmap.md`, priorities are:

1. **Payment Integration** (Priority #1 — gateway NOT yet decided as of 2026-07-18)
   - Business owner has deferred the Stripe vs PayPal vs other decision
   - Checkout currently records orders without charging; do not claim payment security in copy
   - Once decided: integrate gateway + sales tax handling (e.g., Stripe Tax)

2. **Catalog/eCommerce Toggle** (Priority #2)
   - Admin setting to disable cart
   - WhatsApp/Instagram contact mode
   - Flexible business model

3. **Email Notifications**
   - Order confirmations
   - Shipping updates
   - Admin alerts

4. **Production Deployment**
   - Performance optimization
   - CDN configuration
   - Monitoring setup

---

## Getting Help

### Documentation

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/UI**: https://ui.shadcn.com

### Project Resources

- **Readme.md**: Quick start guide
- **roadmap.md**: Development progress and next steps
- **.env.example**: Environment setup guide

### Common Issues & Solutions

See [Troubleshooting](#troubleshooting) section above.

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-21 | 1.0.0 | Initial CLAUDE.md creation - comprehensive guide |
| 2026-07-18 | 1.1.0 | Added site footer (SiteFooter + ConditionalLayoutWrapper `footer` prop), policy pages (/shipping-policy, /returns, /privacy-policy, /terms), /size-guide with product-page link, PolicyPageShell + lib/store-settings.ts. Rewrote homepage/About/metadata brand copy for Indian women's ethnic wear in the USA; removed unverifiable claims. Homepage category tiles now show newest product photo per category. |
| 2026-07-19 | 1.3.0 | UI/content review fixes: (1) DynamicHeroSection now renders slide title/subtitle/description/CTA (previously only painted the background — all copy was invisible); (2) AdminNavigation blue-600/500 → purple to match the rest of the app; (3) dark mode disabled app-wide (ThemeContext forces light; removed ThemeToggle from customer + admin navs) since only a few components were ever dark-styled; (4) removed the non-functional wishlist heart from ProductCard + header; (5) replaced remaining "Free shipping over $100" banner claims (CustomerNavigation, LightweightNavigation, contact) with honest on-brand copy; (6) added `force-dynamic` to /api/hero-slides (was build-cached, so admin-added slides never appeared); deleted 5 placeholder test hero slides from DB so the real fallback copy shows. Verified in-browser. |
| 2026-07-18 | 1.2.1 | Security fixes before launch: (1) removed `env` block from next.config.js that was inlining DATABASE_URL + JWT_SECRET into the CLIENT bundle; (2) deleted src/app/test-login (hardcoded admin password); (3) src/lib/auth.ts now throws if JWT_SECRET missing/<32 chars instead of using 'fallback-secret-key'; (4) added getSession auth guard to GET+POST in api/admin/orders/route.ts (was public, leaked all orders/PII); (5) middleware now verifies JWT signature via jose (edge-compatible) instead of only checking token length >= 10. ACTION REQUIRED: rotate JWT_SECRET and change admin password — old values are in git history. |
| 2026-07-18 | 1.2.0 | Configured real store settings in DB (row id `default` created; orphaned `test-settings` row deleted — code always queried `default`, so the site had been running on fallbacks). Catalog Mode ENABLED (matches "DM to order" Instagram business model), returns DISABLED (matches Instagram "No returns & refunds"), brand set: "Hita & Co", tagline "Timeless Indian elegance for modern spirit", black/white/amber colors, Instagram link. Homepage third highlight card is now "DM to Order"; footer/pages say "Sales Policy". NOTE: catalog has zero published products; WhatsApp order button needs a number in admin settings. |

---

**End of Guide**

This document should be updated as the project evolves. When making significant architectural changes, update this guide to reflect the new patterns and conventions.
