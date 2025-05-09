import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";

import AppHeader from "../header/AppHeader";
import { api } from "@/service/apiClient";
import { transaction } from "../(transactions)/transaction";

export default function TransactionsScreen() {
    const [transactionList, setTransactionList] = useState<transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const fetchTx = async () => {
        try {
            loading || setLoading(true);
            const { data } = await api.get("/transactions");
            setTransactionList(data);
        } finally {
            loading || setLoading(false);
        }
    };

    useEffect(() => { fetchTx(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);              
        await fetchTx();
        setRefreshing(false);
    };


    const data = useMemo(() => {
        let list = [...transactionList];

        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((t) => t.label.toLowerCase().includes(q));
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

    const formatAmount = (type: String, amt: number, currency: string) =>
      `${type === "INCOME" ? "+" : "-"}${Math.abs(amt).toFixed(2)}${currency}`;

    const formatDate = (iso: string) => {
      const d = new Date(iso);                 
      const pad = (n: number) => String(n).padStart(2, "0");
    
      return (
          `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
          `${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    };
    

    const renderItem = useCallback(

      ({ item }: { item: transaction }) => (
          <TouchableOpacity
              onPress={() => router.push({
                  pathname: "/(transactions)/transaction",
                  params: {
                      id: item.id,
                      label: item.label,
                      amount: item.amount,
                      creationDate: item.creationDate,
                      transactionTypeEnum: item.transactionTypeEnum,
                      category: item.category.label,
                      budget: item.budget.label,
                      location: item.location ? item.location.name : "No location",
                      frequencyEnum: item.frequencyEnum,
                      note: item.note ? item.note : "No note",
                      filename: item.filename ? item.filename : "No file",
                      currency: item.currency,
                  },
              }
              )}
          >
              <View style={styles.row}>
                  <View style={styles.labelBlock}>
                      <Text style={styles.label}>{item.label || "User"}</Text>
                      <Text style={styles.sub}>{formatDate(item.creationDate)}</Text>
                  </View>

                  <Text style={styles.amount}>
                      {formatAmount(item.transactionTypeEnum, item.amount, item.currency ?? "€")}
                  </Text>
              </View>
          </TouchableOpacity>
      ),
      []
    );

    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "Transactions",
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
                  onPress={() => router.push({ pathname: "/(transactions)/[id]", params: { id: "new" }})}
              >
                  <Ionicons name="add" size={24} />
              </TouchableOpacity>
          </View>

          <View style={styles.pickers}>
              <View style={styles.pickerBlock}>
                  <Text style={styles.pickerLabel}>Filtering</Text>
                  <Picker
                      mode="dropdown"
                      selectedValue={filter}
                      onValueChange={(v) =>
                          setFilter(v as "all" | "incoming" | "outgoing")
                      }
                      style={styles.picker}
                  >
                      <Picker.Item label="All" value="all" />
                      <Picker.Item label="Incoming" value="incoming" />
                      <Picker.Item label="Outgoing" value="outgoing" />
                  </Picker>
              </View>

              <View style={styles.pickerBlock}>
                  <Text style={styles.pickerLabel}>Sorting</Text>
                  <Picker
                      mode="dropdown"
                      selectedValue={sortDir}
                      onValueChange={(v) => setSortDir(v as "asc" | "desc")}
                      style={styles.picker}
                  >
                      <Picker.Item label="Ascending" value="asc" />
                      <Picker.Item label="Descending" value="desc" />
                  </Picker>
              </View>
          </View>

          {loading ? (
              <ActivityIndicator style={{ marginTop: 32 }} />
          ) : (
              <FlatList
                  data={data}
                  keyExtractor={(_, i) => String(i)}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={renderItem}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  refreshing={refreshing}         
                  onRefresh={handleRefresh}
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
    pickerLabel: { fontSize: 12, marginBottom: 2 },
    picker: { backgroundColor: "#F0F0F0", borderRadius: 8},
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    labelBlock: { maxWidth: "70%" },
    label: { fontWeight: "500" },
    sub: { fontSize: 12, color: "#666" },
    amount: { fontWeight: "500", alignSelf: "center" },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#D8D8D8",
    },
});
