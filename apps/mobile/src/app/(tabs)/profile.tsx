import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={["#ffffff", "#d4d4d8", "#a1a1aa"]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>U</Text>
          </LinearGradient>
        </View>

        <Text style={styles.name}>Welcome back</Text>
        <Text style={styles.handle}>@user</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="Outfits" value="0" />
          <Stat label="Followers" value="0" />
          <Stat label="Following" value="0" />
        </View>

        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={["#ffffff", "#d4d4d8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeButton}
          >
            <Text style={styles.upgradeText}>Upgrade to Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  content: { padding: 16, paddingBottom: 100, alignItems: "center" },
  avatarContainer: { marginTop: 24, marginBottom: 16 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "white" },
  name: { fontSize: 22, fontWeight: "800", color: "white" },
  handle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  statsRow: {
    flexDirection: "row", gap: 24, marginTop: 24, marginBottom: 32,
    paddingVertical: 16, paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "white" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  upgradeButton: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
    shadowColor: "#ffffff", shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8,
  },
  upgradeText: { color: "white", fontWeight: "700", fontSize: 14 },
})
