import { useState } from "react";
import { Stack } from "expo-router";
import { View, Text, Pressable } from "react-native";

import AppHeader from "../header/AppHeader";
import { useAuth } from "@/contexts/AuthContext";

const SettingsScreen = () => {
    const { signOut } = useAuth();
    const [signOutting, setSigningOut] = useState(false);

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "Settings",
                    headerRight: () => ( <AppHeader /> ),
                    headerTitleAlign: "center",
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Pressable onPress={() => {signOut(); setSigningOut(true);}} style={{ padding: 16, backgroundColor: "#2196F3", borderRadius: 8 }}>
                    <Text style={{ color: "#fff" }}>Sign out</Text>
                </Pressable>
            </View>
        </>
    );
}

export default SettingsScreen;