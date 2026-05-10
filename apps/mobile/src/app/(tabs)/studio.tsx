import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Platform
} from "react-native"
import { useState, useCallback } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as Haptics from "expo-haptics"
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withTiming, interpolate, Easing
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { useMutation } from "@tanstack/react-query"
import { Wand2, Upload, X, Sparkles, TrendingUp } from "lucide-react-native"
import { api, apiRoutes } from "@/lib/api"
import type { StyleCategory, AiGeneration } from "@stylesnap/types"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

const STYLES: { value: StyleCategory; label: string; emoji: string }[] = [
  { value: "STREETWEAR", label: "Streetwear", emoji: "🏙️" },
  { value: "LUXURY", label: "Luxury", emoji: "💎" },
  { value: "OLD_MONEY", label: "Old Money", emoji: "🎩" },
  { value: "TECHWEAR", label: "Techwear", emoji: "⚡" },
  { value: "Y2K", label: "Y2K", emoji: "✨" },
  { value: "MINIMAL", label: "Minimal", emoji: "◻️" },
  { value: "VINTAGE", label: "Vintage", emoji: "📷" },
  { value: "ANIME", label: "Anime", emoji: "🌸" },
  { value: "CYBERPUNK", label: "Cyberpunk", emoji: "🤖" },
]

export default function StudioScreen() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleCategory>("STREETWEAR")
  const [creativity, setCreativity] = useState(0.7)
  const [result, setResult] = useState<AiGeneration | null>(null)

  const generateScale = useSharedValue(1)
  const glowOpacity = useSharedValue(0.4)
  const resultOpacity = useSharedValue(0)

  const generateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: generateScale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ translateY: interpolate(resultOpacity.value, [0, 1], [20, 0]) }],
  }))

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    })
    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const generateMutation = useMutation({
    mutationFn: async () => {
      glowOpacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true)
      const { data } = await api.post(apiRoutes.ai.generateOutfit, {
        styleCategory: selectedStyle,
        creativity,
        generateVariants: 3,
        inputImageUrl: uploadedImage ?? undefined,
      })
      return data as AiGeneration
    },
    onSuccess: (gen) => {
      setResult(gen)
      glowOpacity.value = withTiming(0.4, { duration: 300 })
      resultOpacity.value = withSpring(1, { damping: 20 })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
    onError: () => {
      glowOpacity.value = withTiming(0.4)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    },
  })

  function onPressGenerate() {
    generateScale.value = withSpring(0.96, {}, () => {
      generateScale.value = withSpring(1)
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    generateMutation.mutate()
  }

  const isGenerating = generateMutation.isPending

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Studio</Text>
          <Text style={styles.headerSubtitle}>Generate your perfect outfit</Text>
        </View>

        {/* Photo upload */}
        <TouchableOpacity
          style={[styles.uploadBox, uploadedImage && styles.uploadBoxFilled]}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {uploadedImage ? (
            <View style={styles.uploadPreview}>
              <Animated.Image
                source={{ uri: uploadedImage }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setUploadedImage(null)}
              >
                <X size={14} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconBox}>
                <Upload size={20} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={styles.uploadText}>Upload your photo</Text>
              <Text style={styles.uploadSubtext}>Optional · For face-preserving AI</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Style picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylesList}
          >
            {STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                onPress={() => {
                  setSelectedStyle(style.value)
                  Haptics.selectionAsync()
                }}
                style={[
                  styles.styleChip,
                  selectedStyle === style.value && styles.styleChipActive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text
                  style={[
                    styles.styleLabel,
                    selectedStyle === style.value && styles.styleLabelActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Generate button */}
        <Animated.View style={generateAnimatedStyle}>
          <TouchableOpacity
            onPress={onPressGenerate}
            disabled={isGenerating}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#ffffff", "#d4d4d8", "#a1a1aa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButton}
            >
              {/* Glow */}
              <Animated.View style={[styles.generateGlow, glowStyle]} />

              {isGenerating ? (
                <View style={styles.generateContent}>
                  <View style={styles.spinner} />
                  <Text style={styles.generateText}>Generating…</Text>
                </View>
              ) : (
                <View style={styles.generateContent}>
                  <Wand2 size={18} color="white" />
                  <Text style={styles.generateText}>Generate Outfit</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Result */}
        {result?.outputImages?.[0] && (
          <Animated.View style={[styles.resultContainer, resultAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Your AI Outfit</Text>
            <View style={styles.resultCard}>
              <Animated.Image
                source={{ uri: result.outputImages[0] }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              <View style={styles.resultBadge}>
                <Sparkles size={12} color="#ffffff" />
                <Text style={styles.resultBadgeText}>AI Generated</Text>
              </View>
              {(result.metadata as any)?.viralityScore && (
                <View style={[styles.resultBadge, styles.viralBadge]}>
                  <TrendingUp size={12} color="#34d399" />
                  <Text style={[styles.resultBadgeText, { color: "#34d399" }]}>
                    {Math.round((result.metadata as any).viralityScore * 100)}% Viral
                  </Text>
                </View>
              )}
            </View>

            {/* Variant strip */}
            {result.outputImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantsList}
              >
                {result.outputImages.map((img, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.8}>
                    <Animated.Image
                      source={{ uri: img }}
                      style={styles.variantThumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 26, fontWeight: "800", color: "white", letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  uploadBox: {
    borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed", overflow: "hidden", marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  uploadBoxFilled: { borderStyle: "solid", borderColor: "rgba(255,255,255,0.3)" },
  uploadPlaceholder: {
    height: 200, alignItems: "center", justifyContent: "center", gap: 8,
  },
  uploadIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  uploadText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
  uploadPreview: { position: "relative" },
  previewImage: { width: "100%", height: 280, borderRadius: 18 },
  removeButton: {
    position: "absolute", top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginBottom: 10,
  },
  stylesList: { gap: 8, paddingRight: 16 },
  styleChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  styleChipActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  styleEmoji: { fontSize: 14 },
  styleLabel: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.4)" },
  styleLabelActive: { color: "#c4b5fd" },
  generateButton: {
    borderRadius: 16, padding: 18, marginBottom: 20,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#ffffff", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  generateGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  generateContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  generateText: { fontSize: 16, fontWeight: "700", color: "white" },
  spinner: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    borderTopColor: "white",
  },
  resultContainer: { marginBottom: 8 },
  resultCard: { borderRadius: 20, overflow: "hidden", position: "relative" },
  resultImage: { width: "100%", height: SCREEN_WIDTH * 1.1, borderRadius: 20 },
  resultBadge: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
  },
  viralBadge: { top: 46 },
  resultBadgeText: { fontSize: 11, fontWeight: "600", color: "#ffffff" },
  variantsList: { gap: 8, paddingTop: 12 },
  variantThumb: {
    width: 64, height: 84, borderRadius: 12,
    borderWidth: 2, borderColor: "transparent",
  },
})
