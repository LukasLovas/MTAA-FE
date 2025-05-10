import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

function RootNavigator() {
  const { token } = useAuth();

  return (
    <Stack>
      {token ? (
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
