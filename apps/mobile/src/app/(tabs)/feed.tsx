import { useState } from "react"
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Image, RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useInfiniteQuery } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import { Heart, TrendingUp, Sparkles, Users, Crown, Compass } from "lucide-react-native"
import { api, apiRoutes } from "@/lib/api"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const COLUMN_GAP = 8
const COLUMNS = 2
const COLUMN_WIDTH = (SCREEN_WIDTH - 32 - COLUMN_GAP) / COLUMNS

const FEEDS = [
  { id: "FOR_YOU", label: "For You", icon: Sparkles },
  { id: "TRENDING", label: "Trending", icon: TrendingUp },
  { id: "FOLLOWING", label: "Following", icon: Users },
  { id: "DISCOVER", label: "Discover", icon: Compass },
  { id: "LUXURY", label: "Luxury", icon: Crown },
] as const

export default function FeedScreen() {
  const [activeFeed, setActiveFeed] = useState<typeof FEEDS[number]["id"]>("FOR_YOU")

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["mobile-feed", activeFeed],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({ limit: "20" })
        if (pageParam) params.set("cursor", pageParam)
        if (activeFeed === "TRENDING") params.set("trending", "true")
        if (activeFeed === "FOLLOWING") params.set("following", "true")
        if (activeFeed === "LUXURY") params.set("style", "LUXURY")

        const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}`)
        return data
      },
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    })

  const outfits = data?.pages.flatMap((p) => p.items) ?? []

  // Split outfits into 2 columns for masonry effect
  const columns: any[][] = Array.from({ length: COLUMNS }, () => [])
  outfits.forEach((outfit, i) => columns[i % COLUMNS].push(outfit))

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Text style={styles.title}>Styliq</Text>
      </View>

      {/* Feed selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.feedSelector}
      >
        {FEEDS.map((feed) => {
          const Icon = feed.icon
          const isActive = activeFeed === feed.id
          return (
            <TouchableOpacity
              key={feed.id}
              onPress={() => {
                setActiveFeed(feed.id)
                Haptics.selectionAsync()
              }}
              style={[styles.feedTab, isActive && styles.feedTabActive]}
              activeOpacity={0.85}
            >
              <Icon size={14} color={isActive ? "white" : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.feedTabText, isActive && styles.feedTabTextActive]}>
                {feed.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="white" />
        }
        onScroll={({ nativeEvent }) => {
          const isNearBottom =
            nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 600
          if (isNearBottom && hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        scrollEventThrottle={400}
      >
        {isLoading ? (
          <MasonrySkeleton />
        ) : outfits.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.masonry}>
            {columns.map((col, i) => (
              <View key={i} style={[styles.column, { width: COLUMN_WIDTH }]}>
                {col.map((outfit) => (
                  <OutfitTile key={outfit.id} outfit={outfit} />
                ))}
              </View>
            ))}
          </View>
        )}

        {isFetchingNextPage && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading more…</Text>
          </View>
        )}

        {/* Tab bar spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function OutfitTile({ outfit }: { outfit: any }) {
  // Random aspect ratio for Pinterest masonry feel
  const aspectRatio = 0.7 + ((outfit.id.charCodeAt(0) ?? 0) % 50) / 100

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.tile}>
      <Image
        source={{ uri: outfit.thumbnailUrl ?? outfit.imageUrl }}
        style={[styles.tileImage, { aspectRatio }]}
        resizeMode="cover"
      />

      {outfit.isTrending && (
        <View style={styles.trendingBadge}>
          <TrendingUp size={9} color="#34d399" />
          <Text style={styles.trendingText}>Trending</Text>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={styles.tileGradient}
      >
        <View style={styles.tileFooter}>
          <View style={styles.userRow}>
            {outfit.user?.avatarUrl ? (
              <Image source={{ uri: outfit.user.avatarUrl }} style={styles.tileAvatar} />
            ) : (
              <View style={[styles.tileAvatar, { backgroundColor: "#ffffff" }]} />
            )}
            <Text style={styles.tileUsername} numberOfLines={1}>
              @{outfit.user?.username}
            </Text>
          </View>
          <View style={styles.likeRow}>
            <Heart size={10} color="white" fill="white" />
            <Text style={styles.likeCount}>
              {formatNumber(outfit.likesCount ?? 0)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

function MasonrySkeleton() {
  const heights = [180, 240, 200, 280, 220, 300, 190, 260]
  return (
    <View style={styles.masonry}>
      {[0, 1].map((col) => (
        <View key={col} style={{ width: COLUMN_WIDTH, gap: COLUMN_GAP }}>
          {[...Array(4)].map((_, i) => (
            <View
              key={i}
              style={{
                width: "100%",
                height: heights[(col * 4 + i) % heights.length],
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

function EmptyState() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 80 }}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>👗</Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>It's quiet here</Text>
    </View>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    paddingHorizontal: 16, paddingBottom: 4, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  title: {
    fontSize: 28, fontWeight: "900", color: "white",
    letterSpacing: -0.5,
  },
  feedSelector: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  feedTab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  feedTabActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  feedTabText: {
    fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.4)",
  },
  feedTabTextActive: { color: "white" },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  masonry: { flexDirection: "row", gap: COLUMN_GAP },
  column: { gap: COLUMN_GAP },

  tile: {
    borderRadius: 16, overflow: "hidden", backgroundColor: "#0e0e10",
    position: "relative",
  },
  tileImage: { width: "100%" },
  tileGradient: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 8, paddingBottom: 6, paddingTop: 24,
  },
  tileFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  tileAvatar: { width: 16, height: 16, borderRadius: 8 },
  tileUsername: { fontSize: 10, fontWeight: "600", color: "white", flex: 1 },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  likeCount: { fontSize: 10, fontWeight: "600", color: "white" },

  trendingBadge: {
    position: "absolute", top: 6, left: 6,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  trendingText: { fontSize: 9, fontWeight: "700", color: "#34d399" },
})
