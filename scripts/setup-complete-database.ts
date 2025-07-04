// scripts/setup-complete-database.ts
// =====================================
// 🚀 Setup Complete Database with Sample Data
// This will create all necessary data including the kurta you saw
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupCompleteDatabase() {
  console.log('🚀 Setting up complete database with sample data...\n')

  try {
    // Step 1: Create Countries
    console.log('1️⃣ Creating countries...')
    
    const india = await prisma.country.upsert({
      where: { code: 'IN' },
      update: {},
      create: {
        name: 'India',
        code: 'IN',
        currency: 'INR',
        currencySymbol: '₹',
        exchangeRate: 83.0
      }
    })

    const usa = await prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        name: 'United States',
        code: 'US',
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1.0
      }
    })

    console.log('✅ Created countries: India, USA')

    // Step 2: Create Suppliers
    console.log('\n2️⃣ Creating suppliers...')
    
    const supplier = await prisma.supplier.upsert({
      where: { id: 'supplier_1' },
      update: {},
      create: {
        id: 'supplier_1',
        name: 'Hita&Co Suppliers',
        email: 'suppliers@hitaco.com',
        phone: '+91-9876543210',
        contactPerson: 'Rajesh Kumar',
        address: 'Mumbai, Maharashtra, India'
      }
    })

    console.log('✅ Created supplier: Hita&Co Suppliers')

    // Step 3: Create Categories
    console.log('\n3️⃣ Creating categories...')
    
    const clothingCategory = await prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Traditional and modern clothing items',
        defaultRequiresSizes: true,
        defaultSizeType: 'CLOTHING'
      }
    })

    const sareeCategory = await prisma.category.upsert({
      where: { slug: 'sarees' },
      update: {},
      create: {
        name: 'Sarees',
        slug: 'sarees',
        description: 'Beautiful traditional sarees',
        defaultRequiresSizes: false,
        defaultSizeType: null
      }
    })

    const accessoriesCategory = await prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Jewelry and accessories',
        defaultRequiresSizes: false,
        defaultSizeType: null
      }
    })

    console.log('✅ Created categories: Clothing, Sarees, Accessories')

    // Step 4: Create Products
    console.log('\n4️⃣ Creating products...')
    
    // Create the kurta you saw in the customer portal
    const kurta = await prisma.product.create({
      data: {
        name: 'kurta',
        sku: 'HC-KURT-790016',
        description: 'Beautiful traditional kurta with intricate embroidery work',
        shortDescription: 'Traditional kurta perfect for festivals and occasions',
        originalPrice: 29.99,
        costPriceUSD: 15.00,
        piecePriceUSD: 15.00,
        sellingPriceUSD: 20.94, // After 30% discount
        discountPercentage: 30,
        stockQuantity: 20, // Total across all sizes
        categoryId: clothingCategory.id,
        countryId: india.id,
        supplierId: supplier.id,
        requiresSizes: true,
        sizeType: 'CLOTHING',
        status: 'PUBLISHED',
        isActive: true,
        showDiscountToCustomers: true,
        isFeatured: true,
        tags: ['traditional', 'festival', 'ethnic'],
        images: []
      }
    })

    console.log(`✅ Created kurta: ${kurta.name} (${kurta.sku})`)

    // Create some other sample products
    const saree = await prisma.product.create({
      data: {
        name: 'Silk Saree',
        sku: 'HC-SAREE-001',
        description: 'Elegant silk saree with golden border',
        originalPrice: 150.00,
        costPriceUSD: 75.00,
        piecePriceUSD: 75.00,
        sellingPriceUSD: 135.00,
        discountPercentage: 10,
        stockQuantity: 15,
        categoryId: sareeCategory.id,
        countryId: india.id,
        supplierId: supplier.id,
        requiresSizes: false, // Sarees don't need sizes
        status: 'PUBLISHED',
        isActive: true,
        showDiscountToCustomers: true,
        tags: ['silk', 'traditional', 'wedding'],
        images: []
      }
    })

    const blouse = await prisma.product.create({
      data: {
        name: 'Designer Blouse',
        sku: 'HC-BLOUSE-001',
        description: 'Beautiful designer blouse with beadwork',
        originalPrice: 45.00,
        costPriceUSD: 22.50,
        piecePriceUSD: 22.50,
        sellingPriceUSD: 40.50,
        discountPercentage: 10,
        stockQuantity: 24,
        categoryId: clothingCategory.id,
        countryId: india.id,
        supplierId: supplier.id,
        requiresSizes: true,
        sizeType: 'CLOTHING',
        status: 'PUBLISHED',
        isActive: true,
        showDiscountToCustomers: true,
        tags: ['designer', 'blouse', 'beadwork'],
        images: []
      }
    })

    console.log(`✅ Created additional products: ${saree.name}, ${blouse.name}`)

    // Step 5: Add Sizes to Clothing Items
    console.log('\n5️⃣ Adding sizes to clothing items...')
    
    const standardSizes = [
      { size: 'XS', sortOrder: 0 },
      { size: 'S', sortOrder: 1 },
      { size: 'M', sortOrder: 2 },
      { size: 'L', sortOrder: 3 },
      { size: 'XL', sortOrder: 4 },
      { size: 'XXL', sortOrder: 5 }
    ]

    // Add sizes to kurta
    console.log('   Adding sizes to kurta...')
    for (const sizeData of standardSizes) {
      await prisma.productSize.create({
        data: {
          productId: kurta.id,
          size: sizeData.size,
          sku: `${kurta.sku}-${sizeData.size}`,
          stockQuantity: sizeData.size === 'XL' ? 1 : 1, // Match what you saw in customer portal
          lowStockAlert: 1,
          sortOrder: sizeData.sortOrder,
          isActive: true
        }
      })
    }

    // Add sizes to blouse
    console.log('   Adding sizes to blouse...')
    for (const sizeData of standardSizes) {
      await prisma.productSize.create({
        data: {
          productId: blouse.id,
          size: sizeData.size,
          sku: `${blouse.sku}-${sizeData.size}`,
          stockQuantity: 4,
          lowStockAlert: 2,
          sortOrder: sizeData.sortOrder,
          isActive: true
        }
      })
    }

    console.log('✅ Added sizes to clothing items')

    // Step 6: Create Store Settings
    console.log('\n6️⃣ Creating store settings...')
    
    await prisma.storeSettings.upsert({
      where: { id: 'store_1' },
      update: {},
      create: {
        id: 'store_1',
        storeName: 'Hita&Co',
        tagline: 'Traditional Fashion, Modern Style',
        description: 'Your premier destination for authentic Indian fashion',
        email: 'info@hitaco.com',
        phone: '+1-555-0123',
        primaryColor: '#1f2937',
        secondaryColor: '#f3f4f6',
        currency: 'USD'
      }
    })

    console.log('✅ Created store settings')

    // Step 7: Create a Sample Exhibition
    console.log('\n7️⃣ Creating sample exhibition...')
    
    const exhibition = await prisma.exhibition.create({
      data: {
        title: 'Spring Fashion Show 2025',
        description: 'Showcase of our latest spring collection',
        location: 'New York Convention Center',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'), // Long running for testing
        participationFee: 500.00,
        images: [],
        isActive: true
      }
    })

    console.log(`✅ Created exhibition: ${exhibition.title}`)

    // Step 8: Verification
    console.log('\n8️⃣ Verification...')
    
    const productCount = await prisma.product.count()
    const sizeCount = await prisma.productSize.count()
    const categoryCount = await prisma.category.count()
    const exhibitionCount = await prisma.exhibition.count()

    console.log(`✅ Database populated successfully!`)
    console.log(`   Products: ${productCount}`)
    console.log(`   Product Sizes: ${sizeCount}`)
    console.log(`   Categories: ${categoryCount}`)
    console.log(`   Exhibitions: ${exhibitionCount}`)

    // Show the products with their sizes
    const productsWithSizes = await prisma.product.findMany({
      include: {
        productSizes: true,
        category: true
      }
    })

    console.log('\n📦 Products created:')
    productsWithSizes.forEach(product => {
      console.log(`   ${product.name} (${product.sku}) - ${product.category.name}`)
      if (product.requiresSizes) {
        console.log(`     Sizes: ${product.productSizes.map(s => `${s.size}(${s.stockQuantity})`).join(', ')}`)
      } else {
        console.log(`     Stock: ${product.stockQuantity} (no sizes)`)
      }
      console.log(`     Price: $${product.sellingPriceUSD} (${product.discountPercentage}% off)`)
    })

    console.log('\n🎉 Setup Complete!')
    console.log('\n📋 What was created:')
    console.log('✅ Countries (India, USA)')
    console.log('✅ Supplier (Hita&Co Suppliers)')
    console.log('✅ Categories (Clothing, Sarees, Accessories)')
    console.log('✅ Products (Kurta with exact SKU from customer portal)')
    console.log('✅ Product sizes for clothing items')
    console.log('✅ Store settings')
    console.log('✅ Sample exhibition')

    console.log('\n🔄 Next steps:')
    console.log('1. Replace ExhibitionProductsManager component')
    console.log('2. Restart your development server')
    console.log('3. Go to /admin/exhibitions')
    console.log('4. Try adding the kurta to an exhibition')
    console.log('5. You should now see size selection interface!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupCompleteDatabase()
  .then(() => {
    console.log('\n✨ Database setup completed successfully!')
    console.log('\nYour kurta (HC-KURT-790016) is now in the database with sizes!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })

// 🚀 USAGE:
// 1. Save as scripts/setup-complete-database.ts
// 2. Run: npx tsx scripts/setup-complete-database.ts