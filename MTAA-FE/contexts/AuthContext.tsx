import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { api, registerTokenGetter } from '../service/apiClient';

export interface AuthState {
  token: string | null;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync('jwt');
      if (stored) setToken(stored);
      setLoading(false);
    })();
  }, []);

  const signIn = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const newToken = String(data.token);
    await SecureStore.setItemAsync('jwt', newToken);
    setToken(newToken);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('jwt');
    setToken(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
