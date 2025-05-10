import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, router } from "expo-router";

import { api } from "@/service/apiClient";

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

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear())}`;
};

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [budget, setBudget] = useState<budget | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<budget>(`/budgets/${id}`);
      setBudget(data);
    } catch (e) {
      console.error("Error fetching budget:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudget();
    }, [id])
  );

  const handleEdit = () => {
    if (!budget) return;
    const { label, amount, initialAmount, startDate, intervalValue, intervalEnum, lastResetDate } = budget;
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
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  const { label, amount, initialAmount, startDate, intervalValue, intervalEnum, lastResetDate } = budget;

  const formattedAmount = `€${amount.toFixed(2)}\nleft of €\n${initialAmount.toFixed(2)}`;
  const startDateStr = formatDate(startDate);
  const lastResetStr = lastResetDate ? formatDate(lastResetDate) : "N/A";
  const percentLeft = Math.round((amount / initialAmount) * 100);
  const intervalStr = `${intervalValue} ${intervalEnum.toLowerCase()}${intervalValue !== 1 ? "s" : ""}`;

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: "Budget", headerTitleAlign: "center" }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Ionicons name="wallet-outline" size={24} color="black" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>{label}</Text>
            <View style={styles.catRow}>
              <MaterialCommunityIcons name="refresh" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.catText}>{intervalEnum === 'NEVER' ? 'Resets never' : `Resets every ${intervalStr}`}</Text>
            </View>
          </View>
          <Text style={styles.amount} allowFontScaling numberOfLines={3} ellipsizeMode="tail">
            {formattedAmount}
          </Text>
        </View>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillTxt}>Started: {startDateStr}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillTxt}>Last reset: {lastResetStr}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentLeft}%` }]} />
          <Text style={styles.percentageText}>{percentLeft}% left</Text>
        </View>

        <Text style={styles.staticText}>
          You can spend approximately €{(amount / 7).toFixed(2)} per day for the next 7 days.
        </Text>

        <View style={styles.spendingSection}>
          <Text style={styles.sectionTitle}>Recent Spending</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent transactions</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.btn} onPress={handleEdit}>
          <Text style={styles.btnTxt}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { marginTop: 10, backgroundColor: "#FF4D4D" }]} onPress={handleDelete}>
          <Text style={styles.btnTxt}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
  catText: { fontSize: 14, color: "#444" },
  amount: { marginLeft: "auto", flexShrink: 1, fontSize: 16, fontWeight: "600", textAlign: "right" },
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
    backgroundColor: "#333333",
    borderRadius: 8,
  },
  percentageText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    top: 1,
  },
  staticText: { marginBottom: 24, fontSize: 14, color: "#666", textAlign: "center" },
  spendingSection: { marginTop: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  emptyState: { padding: 20, backgroundColor: "#F5F5F5", borderRadius: 8, alignItems: "center" },
  emptyText: { color: "#666" },
  btn: { backgroundColor: "#2B2B2B", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  btnTxt: { color: "#FFF", fontWeight: "600", fontSize: 16 },
});
