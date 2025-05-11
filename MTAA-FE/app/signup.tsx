import React, { useState, useContext } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Redirect, router, Stack } from "expo-router";

import { useAuth } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const { theme } = useContext(ThemeContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [redirect, setRedirect] = useState(false);

    const handleRegister = async () => {
        try {
            setSubmitting(true);
            await signUp(username.trim(), password);
            setRedirect(true);
        } catch (err: any) {
            Alert.alert(
                "Registration failed",
                err?.response?.data?.message ?? err?.message ?? "Unknown error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (redirect) return <Redirect href="/login" />;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                }}
            />
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <TextInput
                    placeholder="Username"
                    placeholderTextColor={theme.colors.border}
                    autoCapitalize="none"
                    onChangeText={setUsername}
                    value={username}
                    style={[
                        styles.input,
                        {
                        borderBottomColor: theme.colors.border,
                        color: theme.colors.text,
                        },
                    ]}
                    />
                    <TextInput
                    placeholder="Password"
                    placeholderTextColor={theme.colors.border}
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                    style={[
                        styles.input,
                        {
                        borderBottomColor: theme.colors.border,
                        color: theme.colors.text,
                        },
                    ]}
                    />

                    <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 },
                    ]}
                    onPress={handleRegister}
                    disabled={submitting}
                    >
                    <Text style={[styles.buttonText, { color: theme.colors.card }]}>
                        {submitting ? "Signing up…" : "Register"}
                    </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.link}
                        onPress={() => {
                            router.push("/login");
                        }}
                    >
                        <Text style={{ color: theme.colors.text, textAlign: "center", marginTop: 16 }}>
                            Already have an account? Log in
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    input: {
        marginBottom: 24,
        borderBottomWidth: 1,
        paddingVertical: 8,
        fontSize: 16,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    link: {
        color: "#007AFF",
        textAlign: "center",
        marginTop: 16,
    },
});
