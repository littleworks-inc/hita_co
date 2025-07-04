// scripts/find-and-setup-products.ts
// =====================================
// 🔍 Find All Products and Setup Sizes
// This will find your existing products and set up sizes for clothing items
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findAndSetupProducts() {
  console.log('🔍 Finding and setting up products with sizes...\n')

  try {
    // Step 1: Find all products
    console.log('1️⃣ Finding all products...')
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        requiresSizes: true,
        sizeType: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`Found ${allProducts.length} products:`)
    allProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.sku})`)
      console.log(`      Category: ${product.category.name}`)
      console.log(`      Requires Sizes: ${product.requiresSizes ? 'Yes' : 'No'}`)
      console.log(`      Size Type: ${product.sizeType || 'Not set'}`)
    })

    if (allProducts.length === 0) {
      console.log('\n❌ No products found!')
      console.log('💡 Please add some products first in the admin panel')
      return
    }

    // Step 2: Identify clothing items that should have sizes
    console.log('\n2️⃣ Identifying products that should have sizes...')
    
    const clothingKeywords = [
      'kurta', 'kurti', 'blouse', 'shirt', 'dress', 'top', 'bottom',
      'pants', 'salwar', 'lehenga', 'suit', 'jacket', 'coat', 'sweater'
    ]

    const clothingCategories = [
      'kurtas', 'blouses', 'clothing', 'apparel', 'dresses', 'tops', 'bottoms'
    ]

    const candidateProducts = allProducts.filter(product => {
      const nameMatch = clothingKeywords.some(keyword => 
        product.name.toLowerCase().includes(keyword.toLowerCase())
      )
      const categoryMatch = clothingCategories.some(category =>
        product.category.name.toLowerCase().includes(category.toLowerCase())
      )
      return nameMatch || categoryMatch
    })

    console.log(`Found ${candidateProducts.length} products that might need sizes:`)
    candidateProducts.forEach(product => {
      console.log(`   📦 ${product.name} (${product.sku}) - ${product.category.name}`)
    })

    // Step 3: Update products to require sizes
    if (candidateProducts.length > 0) {
      console.log('\n3️⃣ Updating products to require sizes...')
      
      for (const product of candidateProducts) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            requiresSizes: true,
            sizeType: 'CLOTHING'
          }
        })
        console.log(`   ✅ Updated ${product.name}`)
      }
    }

    // Step 4: Add standard clothing sizes
    console.log('\n4️⃣ Adding standard clothing sizes...')
    
    const standardSizes = [
      { size: 'XS', sortOrder: 0 },
      { size: 'S', sortOrder: 1 },
      { size: 'M', sortOrder: 2 },
      { size: 'L', sortOrder: 3 },
      { size: 'XL', sortOrder: 4 },
      { size: 'XXL', sortOrder: 5 }
    ]

    for (const product of candidateProducts) {
      console.log(`   Adding sizes for: ${product.name}`)
      
      for (const sizeData of standardSizes) {
        try {
          await prisma.productSize.create({
            data: {
              productId: product.id,
              size: sizeData.size,
              sku: `${product.sku}-${sizeData.size}`,
              stockQuantity: 15, // Default stock per size
              lowStockAlert: 3,
              sortOrder: sizeData.sortOrder,
              isActive: true
            }
          })
        } catch (error) {
          // Size might already exist, skip
          console.log(`     ⚠️  Size ${sizeData.size} already exists for ${product.name}`)
        }
      }
      console.log(`     ✅ Added sizes for ${product.name}`)
    }

    // Step 5: If no clothing found, create a sample kurta
    if (candidateProducts.length === 0) {
      console.log('\n5️⃣ No clothing products found. Creating a sample kurta...')
      
      // Find or create a clothing category
      let clothingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { contains: 'Clothing', mode: 'insensitive' } },
            { name: { contains: 'Kurtas', mode: 'insensitive' } }
          ]
        }
      })

      if (!clothingCategory) {
        clothingCategory = await prisma.category.create({
          data: {
            name: 'Clothing',
            slug: 'clothing',
            description: 'Clothing and apparel items',
            defaultRequiresSizes: true,
            defaultSizeType: 'CLOTHING'
          }
        })
        console.log('   ✅ Created Clothing category')
      }

      // Find a country and supplier
      const country = await prisma.country.findFirst()
      const supplier = await prisma.supplier.findFirst()

      if (!country || !supplier) {
        console.log('   ❌ Need at least one country and supplier to create sample product')
        console.log('   💡 Please add these first in the admin panel')
        return
      }

      // Create sample kurta
      const sampleKurta = await prisma.product.create({
        data: {
          name: 'Sample Kurta',
          sku: 'KURTA-SAMPLE-001',
          description: 'Beautiful traditional kurta with intricate designs',
          originalPrice: 50.00,
          costPriceUSD: 25.00,
          piecePriceUSD: 25.00,
          sellingPriceUSD: 45.00,
          discountPercentage: 10,
          stockQuantity: 90, // Total across all sizes
          categoryId: clothingCategory.id,
          countryId: country.id,
          supplierId: supplier.id,
          requiresSizes: true,
          sizeType: 'CLOTHING',
          status: 'PUBLISHED',
          isActive: true,
          showDiscountToCustomers: true
        }
      })

      console.log(`   ✅ Created sample kurta: ${sampleKurta.name}`)

      // Add sizes to sample kurta
      for (const sizeData of standardSizes) {
        await prisma.productSize.create({
          data: {
            productId: sampleKurta.id,
            size: sizeData.size,
            sku: `${sampleKurta.sku}-${sizeData.size}`,
            stockQuantity: 15,
            lowStockAlert: 3,
            sortOrder: sizeData.sortOrder,
            isActive: true
          }
        })
      }
      console.log(`   ✅ Added sizes to sample kurta`)
    }

    // Step 6: Verification
    console.log('\n6️⃣ Verification...')
    
    const updatedProducts = await prisma.product.findMany({
      where: {
        requiresSizes: true
      },
      include: {
        productSizes: true,
        category: true
      }
    })

    console.log(`✅ Products now requiring sizes: ${updatedProducts.length}`)
    updatedProducts.forEach(product => {
      console.log(`   📦 ${product.name}`)
      console.log(`      Sizes: ${product.productSizes.map(s => s.size).join(', ')}`)
      console.log(`      Total stock: ${product.productSizes.reduce((sum, s) => sum + s.stockQuantity, 0)}`)
    })

    const totalSizes = await prisma.productSize.count()
    console.log(`\n📊 Total product sizes in system: ${totalSizes}`)

    console.log('\n🎉 Setup Complete!')
    console.log('\n📋 What was done:')
    console.log('✅ Found and analyzed existing products')
    console.log('✅ Updated clothing products to require sizes')
    console.log('✅ Added standard sizes (XS, S, M, L, XL, XXL)')
    console.log('✅ Set appropriate stock quantities')

    console.log('\n🔄 Next steps:')
    console.log('1. Replace ExhibitionProductsManager component')
    console.log('2. Restart your development server')
    console.log('3. Test size selection in exhibition management')
    console.log('4. Products requiring sizes will now show size selection interface')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

findAndSetupProducts()
  .then(() => {
    console.log('\n✨ Product setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })

// 🚀 USAGE:
// 1. Save as scripts/find-and-setup-products.ts
// 2. Run: npx tsx scripts/find-and-setup-products.ts