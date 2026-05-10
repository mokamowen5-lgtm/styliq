import { View, Text, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ShopScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>AI-curated fashion picks</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🛍️ Shop coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: "800", color: "white", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 2, marginBottom: 24 },
  placeholder: {
    height: 300, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  placeholderText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
})
