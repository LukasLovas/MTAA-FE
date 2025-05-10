// app/login.tsx

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
import { Redirect } from "expo-router";

import { useAuth } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme } = useContext(ThemeContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await signIn(username.trim(), password);
      setRedirect(true);
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert(
        "Login failed",
        err?.response?.data?.message ?? err?.message ?? "Unknown error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (redirect) return <Redirect href="/(tabs)/DashboardScreen" />;

  return (
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
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={[styles.buttonText, { color: theme.colors.card }]}>
            {submitting ? "Signing in…" : "Sign in"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
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
});
