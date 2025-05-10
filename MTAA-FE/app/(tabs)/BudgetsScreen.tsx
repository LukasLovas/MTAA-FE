import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";
import { api } from "@/service/apiClient";
import { budget as BudgetType } from "../(budgets)/budget";

export default function BudgetsScreen() {
  const [budgetList, setBudgetList] = useState<BudgetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<BudgetType[]>("/budgets/byUsername");
      setBudgetList(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload budgets whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  const data = useMemo(() => {
    let list = [...budgetList];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((b) => b.label.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const aDate = new Date(a.startDate).getTime();
      const bDate = new Date(b.startDate).getTime();
      return sortDir === "asc" ? aDate - bDate : bDate - aDate;
    });

    return list;
  }, [budgetList, query, sortDir]);

  const formatAmount = (amount: number, initialAmount: number) =>
    `€${amount.toFixed(2)} left of €${initialAmount.toFixed(2)}`;

  const calculatePercentage = (amount: number, initialAmount: number) =>
    Math.round((amount / initialAmount) * 100);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear())}`;
  };

  const renderItem = useCallback(
    ({ item }: { item: BudgetType }) => {
      const percentage = calculatePercentage(item.amount, item.initialAmount);
      return (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(budgets)/budget",
              params: {
                id: item.id,
                label: item.label,
                amount: item.amount,
                initialAmount: item.initialAmount,
                startDate: item.startDate,
                intervalValue: item.intervalValue,
                intervalEnum: item.intervalEnum,
                lastResetDate: item.lastResetDate,
              },
            })
          }
        >
          <View style={styles.row}>
            <View style={styles.labelBlock}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.sub}>
                {formatAmount(item.amount, item.initialAmount)}
              </Text>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${percentage}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.amount}>{percentage}%</Text>
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Budgets",
          headerRight: () => <AppHeader />,
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} style={styles.icon} />
            <TextInput
              placeholder="Search"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              router.push({ pathname: "/(budgets)/[id]", params: { id: "new" } })
            }
          >
            <Ionicons name="add" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.pickers}>
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>Start Date</Text>
            <Picker
              mode="dropdown"
              selectedValue={sortDir}
              onValueChange={(v) => setSortDir(v as "asc" | "desc")}
              style={styles.picker}
              itemStyle={{ color: "#000" }}
            >
              <Picker.Item label="Newest first" value="desc" />
              <Picker.Item label="Oldest first" value="asc" />
            </Picker>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No budgets found</Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to create your first budget
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  icon: { marginRight: 6 },
  input: { flex: 1 },
  addBtn: {
    marginLeft: 12,
    backgroundColor: "#E8E8E8",
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pickers: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerBlock: { flex: 1, marginRight: 8 },
  pickerLabel: { fontSize: 12, marginBottom: 2, color: "#000" },
  picker: { backgroundColor: "#F0F0F0", borderRadius: 8 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D8D8D8",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  labelBlock: { maxWidth: "80%" },
  label: { fontWeight: "500", marginBottom: 4 },
  sub: { fontSize: 12, color: "#666", marginBottom: 6 },
  amount: { fontWeight: "500", alignSelf: "center" },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#D0D0D0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#333333",
    borderRadius: 4,
  },
  btn: {
    backgroundColor: "#2B2B2B",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#FFF", fontWeight: "600" },
});
