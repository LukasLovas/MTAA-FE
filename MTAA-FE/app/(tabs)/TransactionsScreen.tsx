import { View, Text, Pressable } from "react-native";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";

export default function TransactionsScreen() {

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Dashboard",
                    headerRight: () => ( <AppHeader /> ),
                    headerTitleAlign: "center",
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Transactions</Text>
                <Pressable onPress={() => router.push("/screens/transaction")} style={{ padding: 16, backgroundColor: "#2196F3", borderRadius: 8 }}>
                    <Text style={{ color: "#fff" }}>Go to Transaction</Text>
                </Pressable>
            </View>
        </>
    );
}