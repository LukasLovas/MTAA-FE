// app/(tabs)/TransactionsScreen.tsx

import React, { useEffect, useMemo, useState, useCallback, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";
import { api } from "@/service/apiClient";
import { transaction } from "../(transactions)/transaction";
import { ThemeContext } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { websocketService } from "@/service/websocketService";
import { useAuth } from "@/contexts/AuthContext";

export default function TransactionsScreen() {
  const { theme } = useContext(ThemeContext);
  const { token } = useAuth();

  const [transactionList, setTransactionList] = useState<transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const transactionsUpdateListenerRef = useRef<(transactions: transaction[]) => void>(null);

  const STORAGE_KEY = "cachedTransactions";

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      if (state.isConnected && token) {
        websocketService.setToken(token);
        connectWebSocket();
      }
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [token]);

  const connectWebSocket = useCallback(() => {
    transactionsUpdateListenerRef.current = (transactions) => {
      console.log("Received transactions update:", transactions.length);
      setTransactionList(transactions);
      setLoading(false);
      
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    };

    websocketService.addTransactionsListener(transactionsUpdateListenerRef.current);
    
    websocketService.connect();
    
    websocketService.subscribeToTransactions();
  }, []);

  useEffect(() => {
    loadInitialTransactions();

    return () => {
      if (transactionsUpdateListenerRef.current) {
        websocketService.removeTransactionsListener(transactionsUpdateListenerRef.current);
      }
    };
  }, []);

  const loadInitialTransactions = async () => {
    setLoading(true);
    
    const net = await NetInfo.fetch();
    setIsOffline(!net.isConnected);

    if (!net.isConnected) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        Alert.alert("Offline mode", "Showing cached transactions.");
        setTransactionList(JSON.parse(cached));
      } else {
        Alert.alert("Offline mode", "No cached transactions.");
        setTransactionList([]);
      }
      setLoading(false);
    } else {
      connectWebSocket();
      
      try {
        const { data } = await api.get<transaction[]>("/transactions");
        setTransactionList(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setLoading(false);
      } catch (err: any) {
        const msg = err.message ?? "Unknown error";
        console.error("Error loading transactions:", msg);
        
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setTransactionList(JSON.parse(cached));
          Alert.alert("Error", "Showing cached transactions.");
        } else {
          setTransactionList([]);
        }
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      websocketService.subscribeToTransactions();
      
      try {
        const { data } = await api.get<transaction[]>("/transactions");
        setTransactionList(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error("Error refreshing transactions:", err);
      }
    } else {
      Alert.alert("Offline mode", "Cannot refresh transactions while offline.");
    }
    
    setRefreshing(false);
  };

  const data = useMemo(() => {
    let list = [...transactionList];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        t.label.toLowerCase().includes(q)
      );
    }

    if (filter !== "all") {
      list = list.filter((t) =>
        filter === "incoming"
          ? t.transactionTypeEnum === "INCOME"
          : t.transactionTypeEnum === "EXPENSE"
      );
    }

    list.sort((a, b) => {
      const aTime = Date.parse(a.creationDate);
      const bTime = Date.parse(b.creationDate);
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [transactionList, query, filter, sortDir]);

  const formatAmount = (type: string, amt: number, cur: string) =>
    `${type === "INCOME" ? "+" : "-"}${Math.abs(amt).toFixed(2)}${cur}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const renderItem = useCallback(
    ({ item }: { item: transaction }) => (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(transactions)/transaction",
            params: {
              id: item.id,
              label: item.label,
              amount: item.amount,
              creationDate: item.creationDate,
              transactionTypeEnum: item.transactionTypeEnum,
              category: item.category?.label || "Uncategorized",
              budget: item.budget?.label || "No budget",
              location: item.location ? item.location.name : "No location",
              frequencyEnum: item.frequencyEnum,
              note: item.note || "No note",
              filename: item.filename || "No file",
              currency: item.currency ?? "€",
            },
          })
        }
      >
        <View style={styles.row}>
          <View style={styles.labelBlock}>
            <Text style={[styles.label, { color: theme.colors.text , fontSize: theme.fontSize?.xlarge}]}>
              {item.label}
            </Text>
            <Text style={[styles.sub, { color: theme.colors.border , fontSize: theme.fontSize?.small}]}>
              {formatDate(item.creationDate)}
            </Text>
          </View>
          <Text style={[
            styles.amount, 
            { 
              color: item.transactionTypeEnum === "INCOME" 
                ? "#2ed573"
                : "#ff6b6b",
              fontSize: theme.fontSize?.xlarge
            }
          ]}>
            {formatAmount(item.transactionTypeEnum, item.amount, item.currency ?? "€")}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [theme]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Transactions",
          headerRight: () => <AppHeader />,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { color: theme.colors.text },
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isOffline && (
          <View style={[styles.offlineBar, { backgroundColor: theme.colors.notification }]}>
            <Text style={styles.offlineText}>You are offline</Text>
          </View>
        )}
        
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={18} color={theme.colors.text} style={styles.icon} />
            <TextInput
              placeholder="Search"
              placeholderTextColor={theme.colors.border}
              style={[styles.input, { color: theme.colors.text, fontSize: theme.fontSize?.large }]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push({ pathname: "/(transactions)/[id]", params: { id: "new" } })}
          >
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.pickers}>
          <View style={styles.pickerBlock}>
            <Text style={[styles.pickerLabel, { color: theme.colors.text, fontSize: theme.fontSize?.medium }]}>Filtering</Text>
            <Picker
              mode="dropdown"
              selectedValue={filter}
              onValueChange={(v) => setFilter(v as any)}
              dropdownIconColor={theme.colors.text}
              style={[styles.picker, { backgroundColor: theme.colors.card }]}
            >
              <Picker.Item label="All" value="all" color={theme.colors.text} />
              <Picker.Item label="Incoming" value="incoming" color={theme.colors.text} />
              <Picker.Item label="Outgoing" value="outgoing" color={theme.colors.text} />
            </Picker>
          </View>
          <View style={styles.pickerBlock}>
            <Text style={[styles.pickerLabel, { color: theme.colors.text , fontSize: theme.fontSize?.medium}]}>Sorting</Text>
            <Picker
              mode="dropdown"
              selectedValue={sortDir}
              onValueChange={(v) => setSortDir(v as any)}
              dropdownIconColor={theme.colors.text}
              style={[styles.picker, { backgroundColor: theme.colors.card }]}
            >
              <Picker.Item label="Ascending" value="asc" color={theme.colors.text} />
              <Picker.Item label="Descending" value="desc" color={theme.colors.text} />
            </Picker>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.colors.text }]}
                >
                  No transactions found
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: theme.colors.border }]}
                >
                  Tap the + button to create your first transaction
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
  offlineBar: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 4,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
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
  separator: { height: StyleSheet.hairlineWidth },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  labelBlock: { maxWidth: "70%" },
  label: { fontWeight: "500" },
  sub: { fontSize: 12, marginBottom: 4 },
  amount: { fontWeight: "500", alignSelf: "center" },
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
});