import { Tabs } from "expo-router"
import { BlurView } from "expo-blur"
import { View, StyleSheet, Platform } from "react-native"
import { Sparkles, LayoutGrid, Wand2, ShoppingBag, User, Layout } from "lucide-react-native"

const TAB_ICON_SIZE = 22

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }]}
          />
        ),
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.3)",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500", marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <LayoutGrid size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: "Studio",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: focused ? "#ffffff" : "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                shadowColor: "#ffffff",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: focused ? 0.5 : 0,
                shadowRadius: 12,
              }}
            >
              <Wand2 size={22} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="boards"
        options={{
          title: "Boards",
          tabBarIcon: ({ color }) => <Layout size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          href: null, // hidden from tab bar but route still accessible
          title: "Shop",
          tabBarIcon: ({ color }) => <ShoppingBag size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  )
}
