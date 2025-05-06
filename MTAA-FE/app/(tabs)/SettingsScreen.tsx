import { useState } from "react";
import { View, Text, Pressable } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

export default function SettingsScreen() {
    const { signOut } = useAuth();
    const [signOutting, setSigningOut] = useState(false);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Pressable onPress={() => {signOut(); setSigningOut(true);}} style={{ padding: 16, backgroundColor: "#2196F3", borderRadius: 8 }}>
                <Text style={{ color: "#fff" }}>Sign out</Text>
            </Pressable>
        </View>
    );
}