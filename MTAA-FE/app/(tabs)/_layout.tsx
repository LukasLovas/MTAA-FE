import { Tabs, Redirect } from "expo-router";

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { useAuth } from "@/contexts/AuthContext";

const TabsLayout = () => {
    const { token } = useAuth();

    if (!token) return <Redirect href="/login" />;

    return (
        <Tabs
            initialRouteName="DashboardScreen"
        >
            <Tabs.Screen
                name="DashboardScreen"
                options={{
                    headerTitle: "Dashboard",
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="TransactionsScreen"
                options={{
                    headerTitle: "Transactions",
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="compare-arrows" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="BudgetsScreen"
                options={{
                    headerTitle: "Budgets",
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cash" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="SettingsScreen"
                options={{
                    headerTitle: "Settings",
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    )
}

export default TabsLayout;