import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'thehitanco@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  const hashedPassword = await hashPassword(adminPassword)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Hita&Co Admin',
      role: 'admin',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create default countries
  const countries = [
    {
      name: 'India',
      code: 'IN',
      currency: 'INR',
      currencySymbol: '₹',
      exchangeRate: 83.0,
      isDefault: true,
    },
    {
      name: 'Bangladesh',
      code: 'BD',
      currency: 'BDT',
      currencySymbol: '৳',
      exchangeRate: 110.0,
      isDefault: false,
    },
    {
      name: 'Nepal',
      code: 'NP',
      currency: 'NPR',
      currencySymbol: 'रु',
      exchangeRate: 132.0,
      isDefault: false,
    },
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { exchangeRate: country.exchangeRate },
      create: country,
    })
  }

  console.log('✅ Countries created')

  // Create default categories
  const categories = [
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Traditional and modern ethnic wear',
    },
    {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Beautiful handcrafted jewelry pieces',
    },
    {
      name: 'Cosmetics',
      slug: 'cosmetics',
      description: 'Natural and organic beauty products',
    },
    {
      name: 'Soaps & Skincare',
      slug: 'soaps-skincare',
      description: 'Handmade soaps and skincare products',
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Fashion accessories and lifestyle items',
    },
    {
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Decorative items and home accessories',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories created')

  // Create subcategories
  const jewelryCategory = await prisma.category.findUnique({
    where: { slug: 'jewelry' }
  })

  const clothingCategory = await prisma.category.findUnique({
    where: { slug: 'clothing' }
  })

  if (jewelryCategory) {
    const subcategories = [
      {
        name: 'Earrings',
        slug: 'earrings',
        description: 'Traditional and modern earrings',
        parentId: jewelryCategory.id,
      },
      {
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Beautiful necklaces and pendants',
        parentId: jewelryCategory.id,
      },
      {
        name: 'Bangles',
        slug: 'bangles',
        description: 'Stylish bangles and bracelets',
        parentId: jewelryCategory.id,
      },
    ]

    for (const subcategory of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcategory.slug },
        update: {},
        create: subcategory,
      })
    }
  }

  if (clothingCategory) {
    const clothingSubcategories = [
      {
        name: 'Sarees',
        slug: 'sarees',
        description: 'Traditional Indian sarees',
        parentId: clothingCategory.id,
      },
      {
        name: 'Kurtas',
        slug: 'kurtas',
        description: 'Comfortable and stylish kurtas',
        parentId: clothingCategory.id,
      },
      {
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Elegant lehengas for special occasions',
        parentId: clothingCategory.id,
      },
    ]

    for (const subcategory of clothingSubcategories) {
      await prisma.category.upsert({
        where: { slug: subcategory.slug },
        update: {},
        create: subcategory,
      })
    }
  }

  console.log('✅ Subcategories created')

  // Create default store settings
  await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Hita&Co',
      tagline: 'Authentic Indian Ethnic Wear & Lifestyle',
      primaryColor: '#1f2937',
      secondaryColor: '#ffffff',
      accentColor: '#f59e0b',
      email: 'thehitanco@gmail.com',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  })

  console.log('✅ Store settings created')

  // Create sample suppliers
  const sampleSuppliers = [
    {
      name: 'Rajesh Handicrafts',
      contactPerson: 'Mr. Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh@handicrafts.com',
      address: 'Shop 15, Karol Bagh Market',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      businessType: 'Wholesaler',
      rating: 4.5,
      isActive: true
    },
    {
      name: 'Bengal Artisans Co-op',
      contactPerson: 'Mrs. Priya Sen',
      phone: '+91-9123456789',
      email: 'priya@bengalartisans.com',
      address: 'Kumartuli Street',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      businessType: 'Cooperative',
      rating: 4.0,
      isActive: true
    },
    {
      name: 'Local Market Vendor',
      contactPerson: 'Amit Sharma',
      phone: '+91-8765432109',
      address: 'Chandni Chowk',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      businessType: 'Individual Seller',
      rating: 3.5,
      isActive: true
    }
  ]

  for (const supplier of sampleSuppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {},
      create: supplier,
    })
  }

  console.log('✅ Sample suppliers created')

  // Create sample products
  const indiaCountry = await prisma.country.findUnique({
    where: { code: 'IN' }
  })

  const earringsCategory = await prisma.category.findUnique({
    where: { slug: 'earrings' }
  })

  const rajeshSupplier = await prisma.supplier.findUnique({
    where: { name: 'Rajesh Handicrafts' }
  })

  if (indiaCountry && earringsCategory && rajeshSupplier) {
    const sampleProducts = [
      {
        sku: 'HC-EARR-001',
        name: 'Traditional Jhumka Earrings',
        description: 'Beautiful handcrafted jhumka earrings with intricate designs',
        shortDescription: 'Elegant traditional jhumkas',
        categoryId: earringsCategory.id,
        countryId: indiaCountry.id,
        supplierId: rajeshSupplier.id,
        purchaseDate: new Date('2024-01-15'),
        invoiceNumber: 'INV-2024-001',
        originalPrice: 1500, // ₹1500
        originalCurrency: 'INR',
        quantity: 10,
        gstPercentage: 18,
        shippingCost: 200,
        conversionCharges: 50,
        additionalExpenses: 100,
        costPriceUSD: 22.89, // Calculated
        piecePriceUSD: 2.29,
        profitMargin: 100, // 100% markup
        discountPercentage: 10,
        sellingPriceUSD: 41.20,
        stockQuantity: 25,
        lowStockAlert: 5,
        isActive: true,
        isFeatured: true,
        tags: ['traditional', 'handcrafted', 'jhumka', 'ethnic'],
        images: ['/images/jhumka-1.jpg', '/images/jhumka-2.jpg'],
      },
      {
        sku: 'HC-EARR-002',
        name: 'Kundan Drop Earrings',
        description: 'Elegant kundan drop earrings perfect for festive occasions',
        shortDescription: 'Festive kundan drops',
        categoryId: earringsCategory.id,
        countryId: indiaCountry.id,
        supplierId: rajeshSupplier.id,
        purchaseDate: new Date('2024-01-20'),
        invoiceNumber: 'INV-2024-002',
        originalPrice: 2500,
        originalCurrency: 'INR',
        quantity: 5,
        gstPercentage: 18,
        shippingCost: 200,
        conversionCharges: 50,
        additionalExpenses: 100,
        costPriceUSD: 36.14,
        piecePriceUSD: 7.23,
        profitMargin: 80,
        discountPercentage: 5,
        sellingPriceUSD: 61.82,
        stockQuantity: 15,
        lowStockAlert: 3,
        isActive: true,
        isFeatured: false,
        tags: ['kundan', 'festive', 'elegant', 'traditional'],
        images: ['/images/kundan-1.jpg'],
      },
    ]

    for (const product of sampleProducts) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      })
    }

    console.log('✅ Sample products created')
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })