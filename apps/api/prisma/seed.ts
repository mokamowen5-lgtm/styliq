/**
 * Prisma seed — populates the database with demo users, outfits, products, and trends.
 * Run with: pnpm --filter @stylesnap/api run db:seed
 */
import { PrismaClient, StyleCategory, ProductCategory, UserRole } from "@prisma/client"
import * as argon2 from "argon2"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding StyleSnap AI database...")

  // ─── Clear existing data (in dev only) ────────────────────────
  if (process.env.NODE_ENV !== "production") {
    console.log("🧹 Clearing existing data...")
    await prisma.styleTrend.deleteMany()
    await prisma.outfitProduct.deleteMany()
    await prisma.productColor.deleteMany()
    await prisma.product.deleteMany()
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.savedOutfit.deleteMany()
    await prisma.outfit.deleteMany()
    await prisma.aiGeneration.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.user.deleteMany()
  }

  // ─── Demo users ───────────────────────────────────────────────
  console.log("👥 Creating users...")
  const passwordHash = await argon2.hash("Password123", { type: argon2.argon2id })

  const admin = await prisma.user.create({
    data: {
      email: "admin@stylesnap.ai",
      username: "admin",
      displayName: "StyleSnap Admin",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      onboardingCompleted: true,
      emailVerifiedAt: new Date(),
      bio: "Platform administrator",
      subscription: { create: { tier: "VIP", status: "ACTIVE" } },
    },
  })

  const demoUsers = await Promise.all(
    [
      {
        email: "sofia@example.com",
        username: "sofiastyle",
        displayName: "Sofia Laurent",
        bio: "Streetwear curator · 284K TikTok",
        styles: [StyleCategory.STREETWEAR, StyleCategory.Y2K],
        verified: true,
        followers: 12_400,
      },
      {
        email: "james@example.com",
        username: "jparkfashion",
        displayName: "James Park",
        bio: "Designer · Building the future of menswear",
        styles: [StyleCategory.OLD_MONEY, StyleCategory.LUXURY],
        verified: true,
        followers: 8_700,
      },
      {
        email: "amara@example.com",
        username: "amaravibes",
        displayName: "Amara Diallo",
        bio: "Fashion creator · Lagos → Paris",
        styles: [StyleCategory.MINIMAL, StyleCategory.LUXURY],
        verified: true,
        followers: 21_300,
      },
      {
        email: "leo@example.com",
        username: "leotechwear",
        displayName: "Leo Chen",
        bio: "Techwear & ACRONYM enjoyer",
        styles: [StyleCategory.TECHWEAR, StyleCategory.CYBERPUNK],
        verified: false,
        followers: 5_400,
      },
      {
        email: "kai@example.com",
        username: "kaianime",
        displayName: "Kai Nakamura",
        bio: "Harajuku style · Tokyo",
        styles: [StyleCategory.ANIME, StyleCategory.Y2K],
        verified: true,
        followers: 33_100,
      },
    ].map(async (u) =>
      prisma.user.create({
        data: {
          email: u.email,
          username: u.username,
          displayName: u.displayName,
          passwordHash,
          bio: u.bio,
          favoriteStyles: u.styles,
          isVerified: u.verified,
          onboardingCompleted: true,
          emailVerifiedAt: new Date(),
          followersCount: u.followers,
          fashionLevel: Math.floor(u.followers / 1000) + 1,
          experiencePoints: u.followers * 10,
          badges: u.followers > 20_000 ? ["trendsetter", "verified"] : ["early_adopter"],
          subscription: {
            create: { tier: u.followers > 20_000 ? "VIP" : "PREMIUM", status: "ACTIVE" },
          },
        },
      })
    )
  )

  // ─── Demo outfits ──────────────────────────────────────────────
  console.log("👗 Creating outfits...")

  const outfitTemplates = [
    {
      title: "Streetwear Sunset",
      styles: [StyleCategory.STREETWEAR],
      tags: ["oversized", "cargo", "sneakers"],
      virality: 0.92,
      trending: true,
    },
    {
      title: "Old Money Sophistication",
      styles: [StyleCategory.OLD_MONEY],
      tags: ["preppy", "loafers", "cashmere"],
      virality: 0.78,
      trending: true,
    },
    {
      title: "Y2K Throwback",
      styles: [StyleCategory.Y2K],
      tags: ["lowrise", "metallic", "butterflies"],
      virality: 0.88,
      trending: true,
    },
    {
      title: "Quiet Luxury Minimalism",
      styles: [StyleCategory.MINIMAL, StyleCategory.LUXURY],
      tags: ["celine", "neutral", "tailored"],
      virality: 0.71,
    },
    {
      title: "Tactical Techwear",
      styles: [StyleCategory.TECHWEAR],
      tags: ["acronym", "functional", "matte"],
      virality: 0.65,
    },
    {
      title: "Harajuku Pop",
      styles: [StyleCategory.ANIME, StyleCategory.Y2K],
      tags: ["colorful", "kawaii", "platform"],
      virality: 0.83,
    },
    {
      title: "Cyberpunk Future",
      styles: [StyleCategory.CYBERPUNK, StyleCategory.TECHWEAR],
      tags: ["neon", "metallic", "boots"],
      virality: 0.69,
    },
    {
      title: "Coastal Grandma",
      styles: [StyleCategory.COASTAL, StyleCategory.OLD_MONEY],
      tags: ["linen", "stripes", "pearls"],
      virality: 0.74,
    },
  ]

  const outfits = []
  for (let i = 0; i < 40; i++) {
    const template = outfitTemplates[i % outfitTemplates.length]
    const user = demoUsers[i % demoUsers.length]
    const placeholderImage = `https://picsum.photos/seed/outfit-${i}/600/800`

    const outfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        title: `${template.title} #${Math.floor(i / outfitTemplates.length) + 1}`,
        description: `AI-generated ${template.styles[0].toLowerCase().replace("_", " ")} outfit. ${template.tags.join(" · ")}`,
        imageUrl: placeholderImage,
        thumbnailUrl: placeholderImage,
        styles: template.styles,
        tags: template.tags,
        viralityScore: template.virality + (Math.random() - 0.5) * 0.1,
        isTrending: template.trending ?? false,
        likesCount: Math.floor(Math.random() * 5000),
        commentsCount: Math.floor(Math.random() * 200),
        savesCount: Math.floor(Math.random() * 800),
        viewsCount: Math.floor(Math.random() * 50_000),
        sharesCount: Math.floor(Math.random() * 300),
        isPublic: true,
      },
    })
    outfits.push(outfit)
  }

  // ─── Likes (random connections) ────────────────────────────────
  console.log("❤️ Creating likes...")
  for (const outfit of outfits.slice(0, 15)) {
    for (const user of demoUsers.slice(0, 3)) {
      if (user.id !== outfit.userId) {
        await prisma.like.create({
          data: { userId: user.id, outfitId: outfit.id },
        }).catch(() => {})
      }
    }
  }

  // ─── Follow graph ──────────────────────────────────────────────
  console.log("👥 Creating follow graph...")
  for (let i = 0; i < demoUsers.length; i++) {
    for (let j = 0; j < demoUsers.length; j++) {
      if (i !== j && Math.random() > 0.4) {
        await prisma.follow
          .create({
            data: { followerId: demoUsers[i].id, followingId: demoUsers[j].id },
          })
          .catch(() => {})
      }
    }
  }

  // ─── Style trends ──────────────────────────────────────────────
  console.log("📈 Creating style trends...")
  await Promise.all([
    {
      name: "Viral Streetwear 2026",
      category: StyleCategory.STREETWEAR,
      trendScore: 0.94,
      growthRate: 0.32,
      source: "tiktok",
      tags: ["#streetwear", "#fyp", "#ootd"],
    },
    {
      name: "Quiet Luxury Renaissance",
      category: StyleCategory.OLD_MONEY,
      trendScore: 0.89,
      growthRate: 0.28,
      source: "instagram",
      tags: ["#oldmoney", "#quietluxury", "#stealthwealth"],
    },
    {
      name: "Y2K Revival 2.0",
      category: StyleCategory.Y2K,
      trendScore: 0.86,
      growthRate: 0.41,
      source: "tiktok",
      tags: ["#y2k", "#2000s", "#nostalgia"],
    },
    {
      name: "Functional Techwear",
      category: StyleCategory.TECHWEAR,
      trendScore: 0.72,
      growthRate: 0.18,
      source: "pinterest",
      tags: ["#techwear", "#acronym", "#functional"],
    },
    {
      name: "Coastal Cottagecore",
      category: StyleCategory.COASTAL,
      trendScore: 0.68,
      growthRate: 0.22,
      source: "instagram",
      tags: ["#coastal", "#cottagecore", "#linen"],
    },
  ].map((trend) =>
    prisma.styleTrend.create({
      data: {
        ...trend,
        description: `Currently trending on ${trend.source}`,
        isActive: true,
      },
    })
  ))

  // ─── Sample products ───────────────────────────────────────────
  console.log("🛍️ Creating products...")
  const productTemplates = [
    { name: "Oversized Hoodie", category: ProductCategory.TOPS, price: 8900, brand: "Essentials" },
    { name: "Cargo Pants", category: ProductCategory.BOTTOMS, price: 12900, brand: "Stüssy" },
    { name: "Designer Sneakers", category: ProductCategory.SHOES, price: 24900, brand: "Nike" },
    { name: "Cashmere Sweater", category: ProductCategory.TOPS, price: 39900, brand: "The Row" },
    { name: "Wide-leg Trousers", category: ProductCategory.BOTTOMS, price: 15900, brand: "COS" },
    { name: "Leather Loafers", category: ProductCategory.SHOES, price: 32900, brand: "Gucci" },
    { name: "Tactical Vest", category: ProductCategory.OUTERWEAR, price: 49900, brand: "ACRONYM" },
    { name: "Mini Bag", category: ProductCategory.BAGS, price: 89900, brand: "Bottega Veneta" },
  ]

  for (const tpl of productTemplates) {
    const slug = tpl.name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 8)
    await prisma.product.create({
      data: {
        ...tpl,
        slug,
        description: `Premium ${tpl.name.toLowerCase()} from ${tpl.brand}.`,
        styles: [StyleCategory.STREETWEAR, StyleCategory.LUXURY],
        tags: [tpl.brand.toLowerCase(), tpl.category.toLowerCase()],
        images: [`https://picsum.photos/seed/${slug}/600/800`],
        thumbnailUrl: `https://picsum.photos/seed/${slug}/300/400`,
        sizes: ["S", "M", "L", "XL"],
        stock: Math.floor(Math.random() * 100) + 10,
        rating: 4 + Math.random(),
        reviewsCount: Math.floor(Math.random() * 500),
        viewsCount: Math.floor(Math.random() * 10_000),
        purchasesCount: Math.floor(Math.random() * 500),
        colors: {
          create: [
            { name: "Black", hex: "#000000", stock: 20 },
            { name: "White", hex: "#FFFFFF", stock: 15 },
          ],
        },
      },
    })
  }

  console.log("✅ Seeding complete!")
  console.log(`
  📊 Summary:
  ────────────────────────────────────
  👤 Users:     ${demoUsers.length + 1} (1 admin, ${demoUsers.length} creators)
  👗 Outfits:   ${outfits.length}
  📈 Trends:    5
  🛍️ Products:  ${productTemplates.length}

  🔑 Login credentials:
  ────────────────────────────────────
  Email:    admin@stylesnap.ai
  Password: Password123

  Demo creators: sofia@, james@, amara@, leo@, kai@example.com
  All use password: Password123
  `)
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
