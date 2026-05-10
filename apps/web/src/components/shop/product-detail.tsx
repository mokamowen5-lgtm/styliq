"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, Heart, Share2, Star, ShoppingBag,
  Truck, RotateCcw, Shield, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatPrice } from "@/lib/utils"
import type { Product } from "@stylesnap/types"

export function ProductDetail({ productId }: { productId: string }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [imageIdx, setImageIdx] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.products.detail(productId))
      return data as Product
    },
  })

  if (isLoading) return <ProductSkeleton />
  if (!product) return <NotFound />

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900">
            <img
              src={product.images[imageIdx] ?? product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge bg-emerald-500/90 text-white text-xs font-bold border-0">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  className={cn(
                    "flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all",
                    i === imageIdx ? "border-white" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">{product.brand}</p>
            <h1 className="text-2xl sm:text-3xl font-display font-black mb-3">{product.name}</h1>

            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < Math.floor(product.rating!)
                          ? "fill-white text-white"
                          : "text-white/20"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-white/60">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-white/30">({product.reviewsCount} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-base text-white/30 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">
                Color: <span className="text-white/40 font-normal">{selectedColor ?? "Pick one"}</span>
              </label>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all",
                      selectedColor === color.name
                        ? "border-white scale-110 shadow-glow-sm"
                        : "border-white/20 hover:border-white/40"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/80">Size</label>
                <button className="text-xs text-white hover:underline">Size guide</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-all",
                      selectedSize === size
                        ? "border-white bg-white/10 text-white"
                        : "border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buy buttons */}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1 py-4 text-base">
              <ShoppingBag className="w-4 h-4" />
              Add to cart
            </button>
            <button className="btn-outline w-12 h-14 p-0 justify-center">
              <Heart className="w-4 h-4" />
            </button>
            <button className="btn-outline w-12 h-14 p-0 justify-center">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Try on with AI */}
          <Link
            href={`/studio?product=${product.id}`}
            className="card flex items-center gap-3 p-4 hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Try this on with AI</p>
              <p className="text-xs text-white/40">See how it looks on you in seconds</p>
            </div>
            <span className="text-white text-sm">→</span>
          </Link>

          {/* Description */}
          {product.description && (
            <div className="card p-5 space-y-2">
              <button
                onClick={() => setShowFullDescription((p) => !p)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-semibold text-sm">Description</span>
                {showFullDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showFullDescription && (
                <p className="text-sm text-white/60 leading-relaxed">{product.description}</p>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <TrustBadge icon={Truck} label="Free shipping" sub="Over €50" />
            <TrustBadge icon={RotateCcw} label="Free returns" sub="30 days" />
            <TrustBadge icon={Shield} label="Authentic" sub="Verified" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function TrustBadge({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div className="card p-3 text-center">
      <Icon className="w-4 h-4 text-white mx-auto mb-1" />
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="text-[10px] text-white/30">{sub}</p>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="skeleton aspect-[3/4] rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-2/3 rounded" />
          <div className="skeleton h-12 w-1/3 rounded" />
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
      <div className="text-5xl">🛍️</div>
      <h2 className="text-xl font-display font-bold">Product not found</h2>
      <Link href="/shop" className="btn-primary text-sm px-5 py-2.5 mt-3">
        Back to shop
      </Link>
    </div>
  )
}
