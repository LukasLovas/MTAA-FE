import React, { useMemo, useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import AppHeader from "../header/AppHeader";
import { ThemeContext } from "@/contexts/ThemeContext";
import { api } from "@/service/apiClient";
import { transaction } from "../(transactions)/transaction";

type category_spending = {
  category_name: string;
  amount: number;
};

const periods = ["DAY", "WEEK", "MONTH"] as const;
const periodToPath: Record<typeof periods[number], string> = {
  DAY: "today",
  WEEK: "week",
  MONTH: "month",
};
const COLORS = [
  "#ff6b6b",
  "#ffa801",
  "#1e90ff",
  "#2ed573",
  "#9c88ff",
  "#ffd32a",
];

export default function DashboardScreen() {
  const { theme } = useContext(ThemeContext);
  const [active, setActive] = useState<typeof periods[number]>("DAY");

  const [todaySpending, setTodaySpending] = useState<category_spending[]>([]);
  const [weeklySpending, setWeeklySpending] = useState<category_spending[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<category_spending[]>([]);

  const [allTransactions, setAllTransactions] = useState<transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);


  useEffect(() => {
  AsyncStorage.removeItem('spending_DAY');
  AsyncStorage.removeItem('spending_WEEK');
  AsyncStorage.removeItem('spending_MONTH');
}, []);


  const fetchSpending = useCallback(async (period: typeof periods[number]) => {
    const key = `spending_${period}`;
    const endpoint = `/transactions/expenses/${periodToPath[period]}`;
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (period === "DAY") setTodaySpending(data);
        if (period === "WEEK") setWeeklySpending(data);
        if (period === "MONTH") setMonthlySpending(data);
      }
      return;
    }
    try {
      const { data } = await api.get<category_spending[]>(endpoint);
      await AsyncStorage.setItem(key, JSON.stringify(data));
      if (period === "DAY") setTodaySpending(data);
      if (period === "WEEK") setWeeklySpending(data);
      if (period === "MONTH") setMonthlySpending(data);
    } catch (e) {
      console.warn(`Failed to fetch ${period} spending, using cache`, e);
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (period === "DAY") setTodaySpending(data);
        if (period === "WEEK") setWeeklySpending(data);
        if (period === "MONTH") setMonthlySpending(data);
      }
    }
  }, []);

  // Reload spending whenever period changes
  useEffect(() => {
    fetchSpending(active);
  }, [active, fetchSpending]);

  // Fetch and cache all transactions once
  const fetchTransactions = async () => {
    const key = "cachedTx";
      setLoadingTx(true);
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) setAllTransactions(JSON.parse(cached));
        setLoadingTx(false);
        return;
      }
      try {
        const { data } = await api.get<transaction[]>("/transactions");
        await AsyncStorage.setItem(key, JSON.stringify(data));
        setAllTransactions(data);
      } catch (e) {
        console.warn("Failed to fetch transactions, using cache", e);
        const cached = await AsyncStorage.getItem(key);
        if (cached) setAllTransactions(JSON.parse(cached));
      } finally {
        setLoadingTx(false);
      }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const spendingData = useMemo(() => {
    const raw = (() => {
      switch (active) {
        case "DAY":
          return todaySpending;
        case "WEEK":
          return weeklySpending;
        default:
          return monthlySpending;
      }
    })();

    return raw.filter(item => item.category_name != null && item.category_name !== "");
  }, [active, todaySpending, weeklySpending, monthlySpending]);

  // Derive latest transactions for selected period
  const recentTx = useMemo(() => {
    const now = Date.now();
    let cutoff = now;
    if (active === "DAY") cutoff -= 24 * 60 * 60 * 1000;
    else if (active === "WEEK") cutoff -= 7 * 24 * 60 * 60 * 1000;
    else cutoff -= 30 * 24 * 60 * 60 * 1000;

    return allTransactions
      .filter(t => new Date(t.creationDate).getTime() >= cutoff)
      .sort((a, b) => Date.parse(b.creationDate) - Date.parse(a.creationDate))
      .slice(0, 5);
  }, [allTransactions, active]);

  // chart geometry
  const radius = 80;
  const stroke = 16;
  const cx = radius + stroke / 2;
  const cy = cx;
  const circumference = 2 * Math.PI * radius;
  let accumOffset = 0;

  const padNum = (n: number) => String(n).padStart(2, "0");
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      `${padNum(d.getDate())}.${padNum(d.getMonth() + 1)}.${d.getFullYear()} ` +
      `${padNum(d.getHours())}:${padNum(d.getMinutes())}`
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
          headerRight: () => <AppHeader />,
          headerLeft: () => (
            <Text
              style={{
                fontSize: theme.fontSize?.xlarge,
                color: theme.colors.text,
                fontWeight: "bold",
                marginLeft: 10,
                marginTop: 10,
              }}
            >
              Hello, John Doe
            </Text>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Spending Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.segment}>
            {periods.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.segmentItem,
                  { backgroundColor: theme.colors.border },
                  active === p && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setActive(p)}
              >
                <Text
                  style={[
                    styles.segmentTxt,
                    { color: theme.colors.background, fontSize: theme.fontSize?.small },
                    active === p && { color: theme.colors.background, fontWeight: "600" },
                  ]}
                >
                  {p[0] + p.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.donutWrap}>
            <Svg width={cx * 2} height={cy * 2}>
              <G rotation="-90" origin={`${cx}, ${cy}`}>
                {spendingData.map((c, i) => {
                  const fraction = c.amount / (spendingData.reduce((s, x) => s + x.amount, 0)) || 0;
                  const dashLength = fraction * circumference;
                  const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
                  const circle = (
                    <Circle
                      key={c.category_name}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={stroke}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={accumOffset}
                      strokeLinecap="round"
                      fill="none"
                    />
                  );
                  accumOffset -= dashLength;
                  return circle;
                })}
              </G>
            </Svg>
            <View style={styles.donutLabel}>
              <Text style={{ textAlign: "center", fontWeight: "600", color: theme.colors.text, fontSize: theme.fontSize?.large }}>
                You spent{"\n"}
                <Text style={{ fontSize: theme.fontSize?.large }}>{spendingData.reduce((s, x) => s + x.amount, 0)}€</Text>
              </Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            {spendingData.map((c, i) => (
              <View key={i} style={styles.legendItem}>
                <Svg width={10} height={10} style={{ marginRight: 4 }}>
                  <Circle cx={5} cy={5} r={5} fill={COLORS[i % COLORS.length]} />
                </Svg>
                <Text style={[styles.legendTxt, { color: theme.colors.text }]}>
                  {c.category_name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.recHeader}>
            <Text style={[styles.recHeaderTxt, { color: theme.colors.text , fontSize: theme.fontSize?.large}]}>Recent transactions</Text>
            <TouchableOpacity
              onPress={() => {
                fetchTransactions();
                setLoadingTx(true);
              }}
              style={[styles.recAdd, { backgroundColor: theme.colors.border, marginRight: 8 }]}
            >
              <Ionicons name="refresh" size={20} color={theme.colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(transactions)/[id]", params: { id: "new" } })}
              style={[styles.recAdd, { backgroundColor: theme.colors.border }]}
            >
              <Ionicons name="add" size={20} color={theme.colors.background} />
            </TouchableOpacity>
          </View>

          {loadingTx ? (
            <ActivityIndicator style={{ alignSelf: "center" }} />
          ) : (
            <FlatList
              data={recentTx}
              keyExtractor={t => String(t.id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.txnRow}
                  onPress={() =>
                    router.push({
                      pathname: "/(transactions)/transaction",
                      params: {
                        id: String(item.id),
                        label: item.label,
                        amount: item.transactionTypeEnum === "INCOME" ? item.amount : -item.amount,
                        creationDate: item.creationDate,
                        transactionTypeEnum: item.transactionTypeEnum,
                        category: item.category.label,
                        budget: item.budget.label,
                        location: item.location ? item.location.name : "No location",
                        frequencyEnum: item.frequencyEnum,
                        note: item.note || "No note",
                        filename: item.filename || "No file",
                        currency: item.currency,
                      },
                    })
                  }
                >
                  <View>
                    <Text style={[styles.txnLabel, { color: theme.colors.text , fontSize: theme.fontSize?.large}]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.txnSub, { color: theme.colors.border , fontSize: theme.fontSize?.small}]}> {formatDate(item.creationDate)}</Text>
                  </View>
                  <Text style={[styles.txnAmt, { color: theme.colors.text, fontSize: theme.fontSize?.large }]}>
                    {(item.transactionTypeEnum === "INCOME" ? "+" : "-") + Math.abs(item.amount)} {item.currency ?? "€"}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/TransactionsScreen")}
            style={{ alignSelf: "center", marginTop: 12 }}
          >
            <Text style={{ textDecorationLine: "underline", color: theme.colors.primary , fontSize: theme.fontSize?.medium }}>
              View all
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  segment: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 14,
    borderRadius: 999,
    padding: 4,
  },
  segmentItem: { paddingVertical: 6, paddingHorizontal: 18, borderRadius: 999 },
  segmentTxt: { fontSize: 12 },
  donutWrap: { alignItems: "center", justifyContent: "center", marginVertical: 10 },
  donutLabel: { position: "absolute", alignItems: "center", justifyContent: "center" },
  legendRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendTxt: { fontSize: 12 },
  recHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  recHeaderTxt: { fontWeight: "600", flex: 1, fontSize: 16 },
  recAdd: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txnRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txnLabel: { fontWeight: "500" },
  txnSub: { fontSize: 12, marginBottom: 4 },
  txnAmt: { fontWeight: "600" },
});
