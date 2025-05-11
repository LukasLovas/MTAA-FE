// app/(budgets)/budget.tsx
import React, { useState, useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, router } from "expo-router";

import { api } from "@/service/apiClient";
import { ThemeContext } from "@/contexts/ThemeContext";

export interface budget {
  id: number;
  label: string;
  amount: number;
  initialAmount: number;
  startDate: string;
  intervalValue: number;
  intervalEnum: string;
  lastResetDate: string;
}

export interface transaction {
  id: number;
  label: string;
  amount: number;
  creationDate: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear())}`;
};

export default function BudgetScreen() {
  const { theme } = useContext(ThemeContext);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [budget, setBudget] = useState<budget | null>(null);
  const [loading, setLoading] = useState(true);

  const [recent, setRecent] = useState<transaction[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fetchBudget = async () => {
    setLoading(true);

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      const cached = await AsyncStorage.getItem("cachedBudgets");
      if (cached) {
        const all: budget[] = JSON.parse(cached);
        const fromCache = all.find((b) => String(b.id) === String(id));
        if (fromCache) {
          Alert.alert("Offline mode", "Showing cached data.");
          setBudget(fromCache);
        } else {
          Alert.alert("Offline mode", "This budget is not cached.");
        }
      } else {
        Alert.alert("Offline mode", "No budgets are cached.");
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get<budget>(`/budgets/${id}`);
      setBudget(data);

      const existing = await AsyncStorage.getItem("cachedBudgets");
      let list: budget[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((b) => String(b.id) === String(id));
      if (idx >= 0) list[idx] = data;
      else list.push(data);
      await AsyncStorage.setItem("cachedBudgets", JSON.stringify(list));
    } catch (e: any) {
      const cached = await AsyncStorage.getItem("cachedBudgets");
      if (cached) {
        const all: budget[] = JSON.parse(cached);
        const fromCache = all.find((b) => String(b.id) === String(id));
        if (fromCache) {
          Alert.alert("Error", "Showing cached data.");
          setBudget(fromCache);
        } else {
          Alert.alert("Error", e.message);
        }
      } else {
        Alert.alert("Error", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSpending = async () => {
    setLoadingRecent(true);
    try {
      const { data } = await api.get<transaction[]>(
        `/transactions/budget/${id}`
      );
      setRecent(data);
    } catch (e) {
      console.error("Error fetching recent spending:", e);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudget();
      fetchRecentSpending();
    }, [id])
  );

  const handleEdit = () => {
    if (!budget) return;
    const {
      label,
      amount,
      initialAmount,
      startDate,
      intervalValue,
      intervalEnum,
      lastResetDate,
    } = budget;
    router.push({
      pathname: "/(budgets)/edit",
      params: {
        id,
        label,
        amount: amount.toString(),
        initialAmount: initialAmount.toString(),
        startDate,
        intervalValue: intervalValue.toString(),
        intervalEnum,
        lastResetDate,
      },
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Budget",
      "Are you sure you want to delete this budget?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/budgets/${id}`);
              router.back();
            } catch (error) {
              console.error("Error deleting budget:", error);
              Alert.alert("Failed to delete budget");
            }
          },
        },
      ]
    );
  };

  if (loading || !budget) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const {
    label,
    amount,
    initialAmount,
    startDate,
    intervalValue,
    intervalEnum,
    lastResetDate,
  } = budget;

  const formattedAmount = `€${amount.toFixed(3)}\n left of\n €${initialAmount.toFixed(3)}`;
  const startDateStr = formatDate(startDate);
  const lastResetStr = lastResetDate ? formatDate(lastResetDate) : "N/A";
  const percentLeft = Math.round((amount / initialAmount) * 100);
  const intervalStr = `${intervalValue} ${intervalEnum.toLowerCase()}${intervalValue !== 1 ? "s" : ""
    }`;

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: "Budget",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header row */}
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Ionicons name="wallet-outline" size={24} color={theme.colors.text} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{label}</Text>
            <View style={styles.catRow}>
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                style={{ marginRight: 4 }}
                color={theme.colors.text}
              />
              <Text style={[styles.catText, { color: theme.colors.text }]}>
                {intervalEnum === "NEVER"
                  ? "Resets never"
                  : `Resets every ${intervalStr}`}
              </Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: theme.colors.text }]}>
            {formattedAmount}
          </Text>
        </View>

        {/* Start/Last reset pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={[styles.pillTxt, { color: theme.colors.text }]}>
              Started: {startDateStr}
            </Text>
          </View>
          <View style={styles.pill}>
            <Text style={[styles.pillTxt, { color: theme.colors.text }]}>
              Last reset: {lastResetStr}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentLeft}%`,
                backgroundColor: theme.dark ? "#FFFFFF" : "#000000",
              },
            ]}
          />
          <Text
            style={[
              styles.percentageText,
              { color: theme.dark ? "#000000" : "#FFFFFF" },
            ]}
          >
            {percentLeft}% left
          </Text>
        </View>

        {/* Day‐per‐day suggestion */}
        <Text style={[styles.staticText, { color: theme.colors.text }]}>
          You can spend approximately €{(amount / 7).toFixed(2)} per day for the
          next 7 days.
        </Text>

        {/* --- RECENT SPENDING --- */}
        <View style={styles.spendingSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Spending
          </Text>

          {loadingRecent ? (
            <ActivityIndicator />
          ) : recent.length > 0 ? (
            recent.map(item => (
              <View key={item.id} style={styles.spendingRow}>
                <Text style={[styles.spendingLabel, { color: theme.colors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.spendingAmount, { color: theme.colors.text }]}>
                  €{item.amount.toFixed(2)}
                </Text>
                <Text style={[styles.spendingDate, { color: theme.colors.border }]}>
                  {formatDate(item.creationDate)}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No recent transactions
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {/* Edit & Delete buttons */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.text }]}
          onPress={handleEdit}
        >
          <Text style={[styles.btnTxt, { color: theme.colors.background }]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { marginTop: 10, backgroundColor: "#FF4D4D" }]}
          onPress={handleDelete}
        >
          <Text style={[styles.btnTxt, { color: "#FFFFFF" }]}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "600" },
  catRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  catText: { fontSize: 14 },
  amount: { fontSize: 16, fontWeight: "600" },

  pillRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillTxt: { marginLeft: 4, fontSize: 13 },

  progressBarContainer: {
    height: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 20,
    position: "relative",
  },
  progressBar: {
    height: "100%",
    borderRadius: 8,
  },
  percentageText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "bold",
    top: 1,
  },

  staticText: { marginBottom: 24, fontSize: 14, textAlign: "center" },

  spendingSection: { marginTop: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  spendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  spendingLabel: { flex: 1 },
  spendingAmount: { width: 80, textAlign: "right" },
  spendingDate: { width: 100, textAlign: "right", fontSize: 12 },

  emptyState: {
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyText: { fontSize: 14 },
  btn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { fontWeight: "600", fontSize: 16 },
});
