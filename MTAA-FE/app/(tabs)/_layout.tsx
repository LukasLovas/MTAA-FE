import React, { useContext } from "react";
import { Tabs, Redirect } from "expo-router";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";

export default function TabsLayout() {
  const { token } = useAuth();
  const { theme } = useContext(ThemeContext);

  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      initialRouteName="DashboardScreen"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="DashboardScreen"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="TransactionsScreen"
        options={{
          headerTitle: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="compare-arrows" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="BudgetsScreen"
        options={{
          headerTitle: "Budgets",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          headerTitle: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
