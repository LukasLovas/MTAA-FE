import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { api, registerTokenGetter } from '../service/apiClient';
import { websocketService } from '../service/websocketService';

export interface AuthState {
  token: string | null;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  signUp(username: string, password: string): Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerTokenGetter(() => token);

    websocketService.setToken(token);
  }, [token]);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync('jwt');
      if (stored) setToken(stored);
      setLoading(false);
    })();
  }, []);

    const signUp = async (username: string, password: string) => {
        const { status } = await api.post('/auth/register', { username, password });
        if (status == 500) {
            throw new Error("Username already exists");
        }
    }

  const signIn = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const newToken = String(data.token);
    await SecureStore.setItemAsync('jwt', newToken);
    setToken(newToken);

    websocketService.setToken(newToken);
    websocketService.connect();
  };

  const signOut = async () => {
    websocketService.disconnect();
    websocketService.setToken(null);

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
    <AuthContext.Provider value={{ token, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};