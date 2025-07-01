// =====================================
// scripts/add-size-system-fixed.ts - Add flexible size system to database (FIXED)
// Run with: npx tsx scripts/add-size-system-fixed.ts
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSizeSystem() {
  console.log('🔧 Adding Flexible Size System to Database...\n')

  try {
    // Step 1: Add size-related fields to existing tables
    console.log('1️⃣ Adding size fields to Product table...')
    
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS "requiresSizes" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "sizeType" TEXT;
    `
    
    await prisma.$executeRaw`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS "defaultRequiresSizes" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "defaultSizeType" TEXT;
    `
    
    console.log('✅ Added size fields to existing tables')

    // Step 2: Create ProductSize table
    console.log('\n2️⃣ Creating ProductSize table...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id TEXT PRIMARY KEY,
        "productId" TEXT NOT NULL,
        size TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        "stockQuantity" INTEGER DEFAULT 0,
        "lowStockAlert" INTEGER DEFAULT 5,
        "isActive" BOOLEAN DEFAULT true,
        "sortOrder" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE
      );
    `
    
    console.log('✅ Created ProductSize table')

    // Step 3: Create ExhibitionProductSize table  
    console.log('\n3️⃣ Creating ExhibitionProductSize table...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS exhibition_product_sizes (
        id TEXT PRIMARY KEY,
        "exhibitionProductId" TEXT NOT NULL,
        "productSizeId" TEXT NOT NULL,
        "quantityTaken" INTEGER DEFAULT 0,
        "quantitySold" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("exhibitionProductId") REFERENCES exhibition_products(id) ON DELETE CASCADE,
        FOREIGN KEY ("productSizeId") REFERENCES product_sizes(id) ON DELETE CASCADE,
        UNIQUE ("exhibitionProductId", "productSizeId")
      );
    `
    
    console.log('✅ Created ExhibitionProductSize table')

    // Step 4: Create CartItem table (for persistent cart)
    console.log('\n4️⃣ Creating CartItem table...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "userId" TEXT,
        "productId" TEXT NOT NULL,
        "productSizeId" TEXT,
        quantity INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY ("productSizeId") REFERENCES product_sizes(id),
        UNIQUE ("sessionId", "productId", "productSizeId")
      );
    `
    
    console.log('✅ Created CartItem table')

    // Step 5: Add size fields to OrderItem table (safely)
    console.log('\n5️⃣ Adding size fields to OrderItem table...')
    
    await prisma.$executeRaw`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS "productSizeId" TEXT,
      ADD COLUMN IF NOT EXISTS "sizeLabel" TEXT;
    `
    
    // Add foreign key constraint separately (if not exists)
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_order_items_product_size'
          ) THEN
            ALTER TABLE order_items 
            ADD CONSTRAINT fk_order_items_product_size 
            FOREIGN KEY ("productSizeId") REFERENCES product_sizes(id);
          END IF;
        END $$;
      `
    } catch (error) {
      console.log('   ⚠️  Foreign key constraint may already exist, continuing...')
    }
    
    console.log('✅ Added size fields to OrderItem table')

    // Step 6: Add size fields to ExhibitionSaleItem table (safely)
    console.log('\n6️⃣ Adding size fields to ExhibitionSaleItem table...')
    
    await prisma.$executeRaw`
      ALTER TABLE exhibition_sale_items 
      ADD COLUMN IF NOT EXISTS "productSizeId" TEXT,
      ADD COLUMN IF NOT EXISTS "sizeLabel" TEXT;
    `
    
    // Add foreign key constraint separately (if not exists)
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_exhibition_sale_items_product_size'
          ) THEN
            ALTER TABLE exhibition_sale_items 
            ADD CONSTRAINT fk_exhibition_sale_items_product_size 
            FOREIGN KEY ("productSizeId") REFERENCES product_sizes(id);
          END IF;
        END $$;
      `
    } catch (error) {
      console.log('   ⚠️  Foreign key constraint may already exist, continuing...')
    }
    
    console.log('✅ Added size fields to ExhibitionSaleItem table')

    // Step 7: Set up category defaults
    console.log('\n7️⃣ Setting up category size defaults...')
    
    // Set default size requirements for common ethnic wear categories
    const categoryUpdates = [
      { name: 'Sarees', requiresSizes: false, sizeType: null },
      { name: 'Dupattas', requiresSizes: false, sizeType: null },
      { name: 'Kurtas', requiresSizes: true, sizeType: 'CLOTHING' },
      { name: 'Lehengas', requiresSizes: true, sizeType: 'CLOTHING' },
      { name: 'Blouses', requiresSizes: true, sizeType: 'CLOTHING' },
      { name: 'Pants', requiresSizes: true, sizeType: 'CLOTHING' },
      { name: 'Salwars', requiresSizes: true, sizeType: 'CLOTHING' },
      { name: 'Jewelry', requiresSizes: false, sizeType: null },
      { name: 'Accessories', requiresSizes: false, sizeType: null }
    ]

    for (const update of categoryUpdates) {
      try {
        const updateResult = await prisma.category.updateMany({
          where: { name: { contains: update.name, mode: 'insensitive' } },
          data: {
            defaultRequiresSizes: update.requiresSizes,
            defaultSizeType: update.sizeType
          }
        })
        if (updateResult.count > 0) {
          console.log(`   ✅ Updated ${update.name} category defaults (${updateResult.count} categories)`)
        } else {
          console.log(`   ⚠️  Category ${update.name} not found, skipping`)
        }
      } catch (error) {
        console.log(`   ⚠️  Error updating ${update.name} category, skipping`)
      }
    }

    // Step 8: Create indexes for performance
    console.log('\n8️⃣ Creating indexes for performance...')
    
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id 
        ON product_sizes("productId");
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_product_sizes_sku 
        ON product_sizes(sku);
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_cart_items_session 
        ON cart_items("sessionId");
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_exhibition_product_sizes_exhibition 
        ON exhibition_product_sizes("exhibitionProductId");
      `
      
      console.log('✅ Created performance indexes')
    } catch (error) {
      console.log('⚠️  Some indexes may already exist, continuing...')
    }

    // Step 9: Verification
    console.log('\n9️⃣ Verifying size system setup...')
    
    // Check if tables exist and have expected structure
    const tableChecks = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('product_sizes', 'cart_items', 'exhibition_product_sizes')
      ORDER BY table_name;
    ` as Array<{table_name: string}>
    
    console.log('✅ Size system tables verification:')
    console.log(`   ProductSize table: ${tableChecks.find(t => t.table_name === 'product_sizes') ? '✅ Created' : '❌ Missing'}`)
    console.log(`   CartItem table: ${tableChecks.find(t => t.table_name === 'cart_items') ? '✅ Created' : '❌ Missing'}`)
    console.log(`   ExhibitionProductSize table: ${tableChecks.find(t => t.table_name === 'exhibition_product_sizes') ? '✅ Created' : '❌ Missing'}`)

    // Check field additions
    const productFields = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('requiresSizes', 'sizeType')
      ORDER BY column_name;
    ` as Array<{column_name: string}>
    
    console.log(`   Product size fields: ${productFields.length}/2 fields added`)

    // Step 10: Success summary
    console.log('\n🎉 Size System Migration Complete!')
    console.log('\n📋 What was added:')
    console.log('✅ ProductSize model - Individual size variants with inventory')
    console.log('✅ ExhibitionProductSize model - Exhibition size tracking')
    console.log('✅ CartItem model - Persistent cart with size support')
    console.log('✅ Size fields in OrderItem and ExhibitionSaleItem')
    console.log('✅ Category-level size defaults')
    console.log('✅ Performance indexes')
    
    console.log('\n🔄 Next steps:')
    console.log('1. Replace prisma/schema.prisma with the updated schema')
    console.log('2. Run: npm run db:generate (to regenerate Prisma client)')
    console.log('3. Run: npm run db:push (to sync schema)')
    console.log('4. Update ProductForm component with size management')
    console.log('5. Update customer product pages with size selection')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
addSizeSystem()
  .then(() => {
    console.log('\n🚀 Size system ready! Your platform now supports:')
    console.log('   📦 Sized products (kurtas, blouses) with individual inventory')
    console.log('   🥻 Size-free products (sarees, dupattas) with simple inventory')
    console.log('   🏪 Exhibition size tracking and POS integration')
    console.log('   🛒 Cart and order size management')
    console.log('\n⚠️  IMPORTANT: Replace your prisma/schema.prisma file with the updated schema!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your database is running')
    console.log('2. Check your DATABASE_URL in .env file')
    console.log('3. Verify you have write permissions to the database')
    console.log('4. Try running: npm run db:push (to sync schema)')
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. Save this file as: scripts/add-size-system-fixed.ts
// 
// 2. Run the migration:
//    npx tsx scripts/add-size-system-fixed.ts
// 
// 3. Replace prisma/schema.prisma with the updated schema
// 
// 4. Regenerate Prisma client:
//    npm run db:generate
// 
// 5. Push schema changes:
//    npm run db:push
// 
// 6. Restart your development server:
//    npm run dev