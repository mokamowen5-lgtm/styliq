"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, SlidersHorizontal, Heart, Star } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatPrice, formatNumber, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { Product, ProductCategory } from "@stylesnap/types"

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "TOPS", label: "Tops" },
  { value: "BOTTOMS", label: "Bottoms" },
  { value: "DRESSES", label: "Dresses" },
  { value: "OUTERWEAR", label: "Outerwear" },
  { value: "SHOES", label: "Shoes" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "BAGS", label: "Bags" },
  { value: "JEWELRY", label: "Jewelry" },
]

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
] as const

export function ShopCatalog() {
  const [category, setCategory] = useState<ProductCategory | "all">("all")
  const [sort, setSort] = useState<typeof SORTS[number]["value"]>("newest")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, sort, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "24", sort })
      if (category !== "all") params.set("category", category)
      const url = search.length >= 2 ? `${apiRoutes.products.search}?q=${search}` : `${apiRoutes.products.list}?${params}`
      const { data } = await api.get(url)
      return data
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black">
          The <span className="gradient-text">Shop</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">AI-curated pieces from 500+ brands</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pieces, brands, styles…"
          className="input pl-12 pr-4 text-base py-3.5"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
              category === cat.value
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-6 text-sm">
        <span className="text-white/40">
          {data?.total ? `${formatNumber(data.total)} items` : data?.items?.length ? `${data.items.length} items` : ""}
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="bg-white/[0.05] border border-white/[0.06] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-zinc-900">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : data?.items?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.items.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <div className="text-4xl">🛍️</div>
          <p className="text-white/40 text-sm">No products found</p>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href={`/shop/${product.id}`} className="group block">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 mb-2">
          <img
            src={product.thumbnailUrl ?? product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              // TODO: wishlist mutation
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-red-400 transition-colors"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          {product.comparePrice && product.comparePrice > product.price && (
            <span className="absolute top-2 left-2 badge bg-emerald-500/90 text-white text-[10px] font-bold border-0">
              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] text-white/40 uppercase tracking-wider truncate">{product.brand}</p>
          <p className="text-sm font-medium text-white truncate group-hover:text-white transition-colors">
            {product.name}
          </p>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-xs text-white/30 line-through">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {product.rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/50">
                <Star className="w-2.5 h-2.5 fill-white text-white" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
