import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Stack, router } from "expo-router";

import { api, getUserIdFromToken } from "@/service/apiClient";
import { ThemeContext } from "@/contexts/ThemeContext";

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateTime = (d: Date) =>
  `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ` +
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export default function NewBudgetScreen() {
  const { theme } = useContext(ThemeContext);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [intervalValue, setIntervalValue] = useState("1");
  const [intervalEnum, setIntervalEnum] = useState<"DAY" | "WEEK" | "MONTH" | "YEAR" | "NEVER">("MONTH");
  const [intervalEnumDropdownVisible, setIntervalEnumDropdownVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const formattedDateTime = formatDateTime(date);

  const isValid =
    title.trim().length > 0 &&
    /^[0-9]+([.,][0-9]{1,2})?$/.test(amount.trim()) &&
    parseFloat(amount.replace(",", ".")) > 0;

  const onSave = async () => {
    if (!isValid) {
      return Alert.alert("Vyplň všetky povinné polia správne.");
    }
    setSaving(true);

    const payload = {
      user_id: getUserIdFromToken(),
      label: title.trim(),
      amount: parseFloat(amount.replace(",", ".")),
      start_date: date.toISOString(),
      interval_value: Number(intervalValue),
      interval_enum: intervalEnum,
    };

    try {
      await api.post("/budgets", payload);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Neúspešné uloženie rozpočtu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "New Budget",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
          <TextInput
            placeholder="Budget title"
            placeholderTextColor={theme.dark ? "#888" : "#aaa"}
            style={[
              styles.input,
              {
                backgroundColor: theme.dark ? "#333" : "#F0F0F0",
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Start Date & Time</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateInput,
              { backgroundColor: theme.dark ? "#333" : "#F0F0F0", borderColor: theme.colors.border },
            ]}
            onPress={() => setDatePickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={theme.colors.text} style={{ marginRight: 6 }} />
            <Text style={{ color: theme.colors.text }}>{formattedDateTime}</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.colors.text }]}>Amount</Text>
          <TextInput
            placeholder="0,00"
            placeholderTextColor={theme.dark ? "#888" : "#aaa"}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                backgroundColor: theme.dark ? "#333" : "#F0F0F0",
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Reset Period Length</Text>
          <TextInput
            placeholder="1"
            placeholderTextColor={theme.dark ? "#888" : "#aaa"}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: theme.dark ? "#333" : "#F0F0F0",
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={intervalValue}
            onChangeText={setIntervalValue}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Period Type</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownToggle,
              { backgroundColor: theme.dark ? "#333" : "#F0F0F0", borderColor: theme.colors.border },
            ]}
            onPress={() => setIntervalEnumDropdownVisible((v) => !v)}
          >
            <Text style={{ color: theme.colors.text }}>
              {intervalEnum.charAt(0) + intervalEnum.slice(1).toLowerCase()}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.colors.text} />
          </TouchableOpacity>

          {intervalEnumDropdownVisible && (
            <View style={[styles.dropdown, { backgroundColor: theme.dark ? "#333" : "#F0F0F0", borderColor: theme.colors.border }]}>
              {(["DAY", "WEEK", "MONTH", "YEAR", "NEVER"] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setIntervalEnum(period);
                    setIntervalEnumDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      { color: theme.colors.text },
                      period === intervalEnum && styles.dropdownTextActive,
                    ]}
                  >
                    {period.charAt(0) + period.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (!isValid || saving) && { opacity: 0.4 }]}
            disabled={!isValid || saving}
            onPress={onSave}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="datetime"
        onConfirm={(d) => {
          setDate(d);
          setDatePickerVisible(false);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  dateInput: { flexDirection: "row", alignItems: "center" },
  dropdownToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdown: { borderRadius: 8, paddingVertical: 4, marginBottom: 14, borderWidth: 1 },
  dropdownItem: { padding: 10 },
  dropdownTextActive: { fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#2B2B2B",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
