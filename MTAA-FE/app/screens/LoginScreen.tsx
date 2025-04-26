import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await signIn(username.trim(), password);
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Login failed", err?.response?.data?.message ?? err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <TextInput
        placeholder="Username"
        autoCapitalize="none"
        onChangeText={setUsername}
        value={username}
        style={{ marginBottom: 12, borderBottomWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={{ marginBottom: 24, borderBottomWidth: 1, padding: 8 }}
      />
      <Button title={submitting ? "Signing in…" : "Sign in"} onPress={handleLogin} disabled={submitting} />
    </View>
  );
}
