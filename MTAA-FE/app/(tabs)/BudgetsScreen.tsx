import { useState, useMemo, useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";
import { api } from "@/service/apiClient";
import { budget as BudgetType } from "../(budgets)/budget";
import { ThemeContext } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default function BudgetsScreen() {
  const { theme } = useContext(ThemeContext);

  const [budgetList, setBudgetList] = useState<BudgetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

const fetchBudgets = async () => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const cached = await AsyncStorage.getItem("cachedBudgets");
    if (cached) {
      Alert.alert("Offline mode", "Showing cached budgets.");
      setBudgetList(JSON.parse(cached));
    } else {
      Alert.alert("Offline mode", "No cached budgets.");
      setBudgetList([]);
    }
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    const { data } = await api.get<BudgetType[]>("/budgets/byUsername");
    setBudgetList(data);
    await AsyncStorage.setItem("cachedBudgets", JSON.stringify(data));
  } catch (error: any) {
    const msg = error?.message ?? "Neznáma chyba";
    Alert.alert("Error", `Couldn't load budgets:\n${msg}`);
    const cached = await AsyncStorage.getItem("cachedBudgets");
    if (cached) {
      setBudgetList(JSON.parse(cached));
      Alert.alert("Offline mode", "Showing cached budgets.");
    } else {
      setBudgetList([]);
    }
  } finally {
    setLoading(false);
  }
};

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
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [budgetList, query, sortDir]);

  const formatAmount = (amount: number, initial: number) =>
    `€${amount.toFixed(2)} left of €${initial.toFixed(2)}`;

  const calculatePercentage = (amount: number, initial: number) =>
    Math.round((amount / initial) * 100);

  const renderItem = useCallback(
    ({ item }: { item: BudgetType }) => {
      const pct = calculatePercentage(item.amount, item.initialAmount);
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
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.sub, { color: theme.colors.text }]}>
                {formatAmount(item.amount, item.initialAmount)}
              </Text>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${pct}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.percentage, { color: theme.colors.text }]}>
              {pct}%
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [theme]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Budgets",
          headerRight: () => <AppHeader />,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { color: theme.colors.text },
        }}
      />

      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.searchRow}>
          <View
            style={[styles.searchBox, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons
              name="search"
              size={18}
              color={theme.colors.text}
              style={styles.icon}
            />
            <TextInput
              placeholder="Search"
              placeholderTextColor={theme.colors.text}
              style={[styles.input, { color: theme.colors.text }]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.card }]}
            onPress={() =>
              router.push({ pathname: "/(budgets)/[id]", params: { id: "new" } })
            }
          >
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Sort by start date */}
        <View style={styles.pickers}>
          <View style={styles.pickerBlock}>
            <Text
              style={[styles.pickerLabel, { color: theme.colors.text }]}
            >
              Start Date
            </Text>
            <Picker
              mode="dropdown"
              selectedValue={sortDir}
              onValueChange={(v) => setSortDir(v as "asc" | "desc")}
              dropdownIconColor={theme.colors.text}
              style={[styles.picker, { backgroundColor: theme.colors.card }]}
            >
              <Picker.Item color={theme.colors.text} label="Newest first" value="desc" />
              <Picker.Item color={theme.colors.text} label="Oldest first" value="asc" />
            </Picker>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.colors.text }]}
                >
                  No budgets found
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: theme.colors.border }]}
                >
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
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  icon: { marginRight: 6 },
  input: { flex: 1 },
  addBtn: {
    marginLeft: 12,
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
  pickerLabel: { fontSize: 12, marginBottom: 2 },
  picker: { borderRadius: 8 },
  separator: {
    height: StyleSheet.hairlineWidth,
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
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  labelBlock: { maxWidth: "80%" },
  label: { fontWeight: "500", marginBottom: 4 },
  sub: { fontSize: 12, marginBottom: 6 },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  percentage: {
    fontWeight: "500",
    alignSelf: "center",
  },
});
