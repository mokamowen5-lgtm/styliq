import { useState } from "react"
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Dimensions, RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import {
  Plus, Lock, Eye, Users, Wand2, ImageIcon, Layout,
} from "lucide-react-native"
import { api } from "@/lib/api"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2

const TABS = [
  { id: "mine", label: "Mine" },
  { id: "discover", label: "Discover" },
] as const

export default function BoardsScreen() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("mine")

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/v1/users/me")).data,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mobile-boards", tab, me?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "30" })
      if (tab === "mine" && me?.id) params.set("ownerId", me.id)
      const { data } = await api.get(`/api/v1/boards?${params}`)
      return data
    },
    enabled: !!me?.id || tab === "discover",
  })

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Boards</Text>
          <Text style={styles.subtitle}>Your aesthetic, organized</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <LinearGradient
            colors={["#ffffff", "#d4d4d8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            <Plus size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => {
              setTab(t.id)
              Haptics.selectionAsync()
            }}
            style={[styles.tab, tab === t.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="white" />
        }
      >
        {isLoading ? (
          <SkeletonGrid />
        ) : data?.items?.length > 0 ? (
          <View style={styles.grid}>
            {data.items.map((board: any) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </View>
        ) : (
          <EmptyState isOwn={tab === "mine"} />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function BoardCard({ board }: { board: any }) {
  const items = board.items ?? []
  const VisIcon = board.visibility === "PRIVATE" ? Lock : board.visibility === "COLLAB" ? Users : Eye

  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, { width: CARD_WIDTH }]}>
      <View style={styles.cardCover}>
        {items.length > 0 ? (
          <View style={styles.collage}>
            <View style={styles.collageBig}>
              {items[0]?.outfit?.thumbnailUrl ? (
                <Image
                  source={{ uri: items[0].outfit.thumbnailUrl }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
              )}
            </View>
            <View style={styles.collageSide}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.collageSmall}>
                  {items[i]?.outfit?.thumbnailUrl ? (
                    <Image
                      source={{ uri: items[i].outfit.thumbnailUrl }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.05)" }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCover}>
            <ImageIcon size={28} color="rgba(255,255,255,0.15)" />
          </View>
        )}

        {board.isSmart && (
          <View style={styles.smartBadge}>
            <Wand2 size={10} color="#ffffff" />
            <Text style={styles.smartText}>Smart</Text>
          </View>
        )}

        {board.visibility !== "PUBLIC" && (
          <View style={styles.visBadge}>
            <VisIcon size={11} color="rgba(255,255,255,0.8)" />
          </View>
        )}

        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{board._count?.items ?? board.itemsCount ?? 0}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>{board.name}</Text>
        {board.owner && (
          <Text style={styles.cardOwner} numberOfLines={1}>@{board.owner.username}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={{
            width: CARD_WIDTH, gap: 8,
          }}
        >
          <View style={{ width: "100%", aspectRatio: 0.85, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ width: "70%", height: 14, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ width: "40%", height: 10, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.04)" }} />
        </View>
      ))}
    </View>
  )
}

function EmptyState({ isOwn }: { isOwn: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 80 }}>
      <View style={styles.emptyIcon}>
        <Layout size={28} color="rgba(255,255,255,0.3)" />
      </View>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
        {isOwn ? "No boards yet" : "Nothing here"}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", maxWidth: 240 }}>
        {isOwn
          ? "Tap the + button to create your first moodboard"
          : "Be the first to create a public board"}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row",
    alignItems: "flex-start", justifyContent: "space-between",
  },
  title: { fontSize: 28, fontWeight: "900", color: "white", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  createButton: { borderRadius: 14 },
  createButtonGradient: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#ffffff", shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8,
  },

  tabs: {
    flexDirection: "row", paddingHorizontal: 16, gap: 4,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.5)" },
  tabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  tabTextActive: { color: "white" },

  content: { paddingHorizontal: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  card: { gap: 8 },
  cardCover: {
    width: "100%", aspectRatio: 0.85,
    borderRadius: 20, overflow: "hidden",
    backgroundColor: "#0e0e10", position: "relative",
  },
  collage: { flex: 1, flexDirection: "row", gap: 1.5 },
  collageBig: { flex: 1.7 },
  collageSide: { flex: 1, gap: 1.5 },
  collageSmall: { flex: 1 },
  emptyCover: { flex: 1, alignItems: "center", justifyContent: "center" },

  smartBadge: {
    position: "absolute", top: 8, left: 8,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  smartText: { fontSize: 9, fontWeight: "700", color: "#ffffff" },

  visBadge: {
    position: "absolute", top: 8, right: 8,
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },

  itemCountBadge: {
    position: "absolute", bottom: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  itemCountText: { fontSize: 10, fontWeight: "700", color: "white" },

  cardFooter: { paddingHorizontal: 4 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "white" },
  cardOwner: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },

  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
})
