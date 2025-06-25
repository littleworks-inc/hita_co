// =====================================
// verify-discount-setup.js - Check if discount system is ready
// Run with: node verify-discount-setup.js
// =====================================

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyDiscountSetup() {
  console.log('🔍 Verifying Discount System Setup...\n')

  try {
    // Test 1: Check if Prisma client recognizes the fields
    console.log('1️⃣ Testing Prisma client field recognition...')
    
    try {
      // This will fail if the field doesn't exist in the generated client
      const testQuery = await prisma.product.findFirst({
        select: {
          id: true,
          name: true,
          discountPercentage: true,
          showDiscountToCustomers: true
        }
      })
      
      console.log('✅ Prisma client recognizes discount fields')
      if (testQuery) {
        console.log('📦 Sample product:', {
          name: testQuery.name,
          discountPercentage: testQuery.discountPercentage,
          showDiscountToCustomers: testQuery.showDiscountToCustomers
        })
      } else {
        console.log('⚠️  No products found, but fields are accessible')
      }
    } catch (error) {
      console.log('❌ Prisma client error:', error.message)
      console.log('💡 Solution: Run "npx prisma generate" and restart your server')
      return false
    }

    // Test 2: Check database schema
    console.log('\n2️⃣ Checking database schema...')
    
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name IN ('discountPercentage', 'showDiscountToCustomers')
        ORDER BY column_name;
      `
      
      if (columns.length === 2) {
        console.log('✅ Database schema includes discount fields:')
        columns.forEach(col => {
          console.log(`   ${col.column_name}: ${col.data_type} (default: ${col.column_default})`)
        })
      } else {
        console.log('❌ Missing discount fields in database schema')
        console.log(`   Found ${columns.length}/2 expected fields`)
        console.log('💡 Solution: Run the database migration commands')
        return false
      }
    } catch (error) {
      console.log('❌ Database schema check failed:', error.message)
      return false
    }

    // Test 3: Test creating a product with discount fields
    console.log('\n3️⃣ Testing product creation with discount fields...')
    
    try {
      // Get required IDs
      const category = await prisma.category.findFirst()
      const country = await prisma.country.findFirst()
      const supplier = await prisma.supplier.findFirst()

      if (!category || !country || !supplier) {
        console.log('⚠️  Missing required data (category, country, or supplier)')
        console.log('   Skipping creation test, but field access is working')
      } else {
        // Test creating with discount fields
        const testProduct = await prisma.product.create({
          data: {
            name: 'Discount Test Product',
            sku: `DISCOUNT-TEST-${Date.now()}`,
            description: 'Test product for discount system verification',
            categoryId: category.id,
            countryId: country.id,
            supplierId: supplier.id,
            originalPrice: 100,
            originalCurrency: 'USD',
            quantity: 1,
            costPriceUSD: 70,
            piecePriceUSD: 70,
            profitMargin: 14.29,
            discountPercentage: 20,
            showDiscountToCustomers: true,
            sellingPriceUSD: 80,
            stockQuantity: 10,
            status: 'PUBLISHED'
          }
        })

        console.log('✅ Successfully created product with discount fields')
        console.log('📦 Test product:', {
          name: testProduct.name,
          sellingPriceUSD: testProduct.sellingPriceUSD,
          discountPercentage: testProduct.discountPercentage,
          showDiscountToCustomers: testProduct.showDiscountToCustomers
        })

        // Calculate expected values
        const originalPrice = testProduct.sellingPriceUSD / (1 - testProduct.discountPercentage / 100)
        const savings = originalPrice - testProduct.sellingPriceUSD
        
        console.log('🧮 Discount calculations:')
        console.log(`   Customer pays: $${testProduct.sellingPriceUSD}`)
        console.log(`   Original price: $${originalPrice.toFixed(2)}`)
        console.log(`   Savings: $${savings.toFixed(2)} (${testProduct.discountPercentage}%)`)
        console.log(`   Visible to customers: ${testProduct.showDiscountToCustomers ? 'Yes' : 'No'}`)

        // Clean up test product
        await prisma.product.delete({
          where: { id: testProduct.id }
        })
        console.log('🧹 Test product cleaned up')
      }
    } catch (error) {
      console.log('❌ Product creation test failed:', error.message)
      return false
    }

    console.log('\n🎉 All tests passed! Discount system is ready to use.')
    console.log('\n📋 Next steps:')
    console.log('1. Update your ProductForm component with discount controls')
    console.log('2. Replace your API routes with the enhanced versions')
    console.log('3. Add discount display components to your frontend')
    console.log('4. Test the complete flow in your application')

    return true

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyDiscountSetup()
  .then((success) => {
    if (success) {
      console.log('\n✨ Discount system verification completed successfully!')
      process.exit(0)
    } else {
      console.log('\n💥 Discount system verification failed!')
      console.log('Please fix the issues above and try again.')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error)
    process.exit(1)
  })