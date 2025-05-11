import React, { useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";
import { ThemeContext } from "@/contexts/ThemeContext";
import { transaction } from "../(transactions)/transaction";

type category_spending = {
  category_name: string;
  amount: number;
};

const periods = ["DAY", "WEEK", "MONTH"] as const;
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
  const [active, setActive] = useState<(typeof periods)[number]>("DAY");

  const [todaySpending, setTodaySpending] = useState<category_spending[]>([]);
  const [weeklySpending, setWeeklySpending] = useState<category_spending[]>([
    { category_name: "Food", amount: 100 },
    { category_name: "Transport", amount: 50 },
    { category_name: "Entertainment", amount: 200 },
  ]);
  const [monthlySpending, setMonthlySpending] = useState<category_spending[]>([
    { category_name: "Food", amount: 300 },
    { category_name: "Transport", amount: 150 },
    { category_name: "Entertainment", amount: 400 },
  ]);
  const [latestTransactions, setLatestTransactions] = useState<transaction[]>([
    {
      id: 1,
      label: "Groceries",
      amount: 50,
      creationDate: "2023-10-01T12:00:00Z",
      transactionTypeEnum: "EXPENSE",
      category: { id: 1, label: "Food" },
      budget: {
        id: 1,
        label: "Monthly Budget",
        amount: 1000,
        initialAmount: 1000,
        startDate: "2023-10-01",
        intervalValue: 1,
        intervalEnum: "MONTH",
        lastResetDate: "2023-10-01",
      },
      location: { id: 1, name: "Supermarket", latitude: 0, longitude: 0 },
      frequencyEnum: "ONE_TIME",
      note: "",
      filename: "",
      currency: "€",
    },
    {
      id: 2,
      label: "Bus Ticket",
      amount: 2.5,
      creationDate: "2023-10-02T08:00:00Z",
      transactionTypeEnum: "EXPENSE",
      category: { id: 2, label: "Transport" },
      budget: {
        id: 1,
        label: "Monthly Budget",
        amount: 1000,
        initialAmount: 1000,
        startDate: "2023-10-01",
        intervalValue: 1,
        intervalEnum: "MONTH",
        lastResetDate: "2023-10-01",
      },
      location: null,
      frequencyEnum: "ONE_TIME",
      note: "",
      filename: "",
      currency: "€",
    },
  ]);

  const spendingData = useMemo(() => {
    switch (active) {
      case "DAY":
        return todaySpending;
      case "WEEK":
        return weeklySpending;
      default:
        return monthlySpending;
    }
  }, [active, todaySpending, weeklySpending, monthlySpending]);

  const totalSpent = spendingData.reduce((s, c) => s + c.amount, 0);

  // chart geometry
  const radius = 80;
  const stroke = 16;
  const cx = radius + stroke / 2;
  const cy = cx;
  const circumference = 2 * Math.PI * radius;
  let accumOffset = 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const formattedLatest = latestTransactions.slice(0, 4);

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
                fontSize: 18,
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
            {periods.map((p) => (
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
                    { color: theme.colors.text },
                    active === p && {
                      color: theme.colors.background,
                      fontWeight: "600",
                    },
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
                  const fraction = c.amount / totalSpent || 0;
                  const dashLength = fraction * circumference;
                  const strokeDasharray = `${dashLength} ${
                    circumference - dashLength
                  }`;
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
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                You spent{"\n"}
                <Text style={{ fontSize: 18 }}>{totalSpent}€</Text>
              </Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            {spendingData.map((c, i) => (
              <View key={i} style={styles.legendItem}>
                <Svg width={10} height={10} style={{ marginRight: 4 }}>
                  <Circle
                    cx={5}
                    cy={5}
                    r={5}
                    fill={COLORS[i % COLORS.length]}
                  />
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
            <Text style={[styles.recHeaderTxt, { color: theme.colors.text }]}>
              Recent transactions
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/(transactions)/[id]", params: { id: "new" } })
              }
              style={[styles.recAdd, { backgroundColor: theme.colors.border }]}
            >
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={formattedLatest}
            keyExtractor={(t) => String(t.id)}
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
                      amount: item.amount,
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
                  <Text style={[styles.txnLabel, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.txnSub, { color: theme.colors.border }]}>
                    {formatDate(item.creationDate)}
                  </Text>
                </View>
                <Text style={[styles.txnAmt, { color: theme.colors.text }]}>
                  {(item.amount > 0 ? "+" : "-") + Math.abs(item.amount)}{" "}
                  {item.currency ?? "€"}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/TransactionsScreen")}
            style={{ alignSelf: "center", marginTop: 12 }}
          >
            <Text style={{ textDecorationLine: "underline", color: theme.colors.primary }}>
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
  segmentItem: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  segmentTxt: { fontSize: 12 },
  donutWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  donutLabel: { position: "absolute", alignItems: "center", justifyContent: "center" },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendTxt: { fontSize: 12 },
  recHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  recHeaderTxt: { fontWeight: "600", flex: 1, fontSize: 16 },
  recAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txnLabel: { fontWeight: "500" },
  txnSub: { fontSize: 12, marginBottom: 4 },
  txnAmt: { fontWeight: "600" },
});
