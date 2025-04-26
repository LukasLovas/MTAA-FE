import React, { createContext, useContext, useEffect, useState } from "react";
import { View, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API = axios.create({ baseURL: "http://10.10.14.76:8080" });

type AuthState = {
  token: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interceptor = API.interceptors.request.use(cfg => {
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return () => API.interceptors.request.eject(interceptor);
  }, [token]);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync("jwt");
      if (stored) setToken(stored);
      setLoading(false);
    })();
  }, []);

  const signIn = async (username: string, password: string) => {
    const res = await API.post("/auth/login", { username, password });
    const { accessToken } = res.data;
    await SecureStore.setItemAsync("jwt", String(accessToken));
    setToken(String(accessToken));
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("jwt");
    setToken(null);
  };

  const value = { token, signIn, signOut };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </View>
  ); 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
