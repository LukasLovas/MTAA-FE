// app/(budgets)/edit.tsx
import React, { useState, useEffect, useContext } from "react";
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
import { Stack, router, useLocalSearchParams } from "expo-router";

import { api } from "@/service/apiClient";
import { ThemeContext } from "@/contexts/ThemeContext";

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateTime = (d: Date) =>
  `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ` +
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

type Mode = "create" | "edit";

export default function EditBudgetScreen() {
  const { theme } = useContext(ThemeContext);
  const params = useLocalSearchParams<{
    id: string;
    label: string;
    amount: string;
    initialAmount: string;
    startDate: string;
    intervalValue: string;
    intervalEnum: string;
    lastResetDate: string;
  }>();
  const mode: Mode =
    params.id && params.id !== "new" ? "edit" : "create";

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [intervalValue, setIntervalValue] = useState("1");
  const [intervalEnum, setIntervalEnum] = useState<
    "DAY" | "WEEK" | "MONTH" | "YEAR" | "NEVER"
  >("MONTH");
  const [intervalEnumDropdownVisible, setIntervalEnumDropdownVisible] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // initialize on mount
    setTitle(params.label || "");
    setAmount(params.initialAmount || "");
    if (params.startDate) setDate(new Date(params.startDate));
    setIntervalValue(params.intervalValue || "1");
    setIntervalEnum((params.intervalEnum as any) || "MONTH");
    setLoading(false);
  }, []);

  const formattedDateTime = formatDateTime(date);
  const isValid =
    title.trim().length > 0 &&
    /^[0-9]+([.,][0-9]{1,2})?$/.test(amount.trim());

  const onSave = async () => {
    if (!isValid) {
      return Alert.alert("Vyplň všetky polia správne.");
    }
    setSaving(true);

    const payload = {
      user_id: 2, // adjust as needed
      label: title.trim(),
      amount: parseFloat(amount.replace(",", ".")),
      start_date: date.toISOString(),
      interval_value: Number(intervalValue),
      interval_enum: intervalEnum,
    };

    try {
      await api.put(`/budgets/${params.id}`, payload);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Nepodarilo sa upraviť rozpočet");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loader,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: mode === "create" ? "New Budget" : "Edit Budget",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { color: theme.colors.text },
        }}
      />

      <KeyboardAvoidingView
        style={[
          styles.flex,
          { backgroundColor: theme.colors.background },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text },
            ]}
          >
            Name
          </Text>
          <TextInput
            placeholder="Budget title"
            placeholderTextColor={theme.colors.border}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text },
            ]}
          >
            Start Date & Time
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateInput,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => setDatePickerVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              style={{ marginRight: 6 }}
              color={theme.colors.text}
            />
            <Text
              style={{ color: theme.colors.text }}
            >
              {formattedDateTime}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text },
            ]}
          >
            Amount
          </Text>
          <TextInput
            placeholder="0,00"
            placeholderTextColor={theme.colors.border}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text },
            ]}
          >
            Reset Period Length
          </Text>
          <TextInput
            placeholder="1"
            placeholderTextColor={theme.colors.border}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            value={intervalValue}
            onChangeText={setIntervalValue}
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text },
            ]}
          >
            Period Type
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownToggle,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              setIntervalEnumDropdownVisible((v) => !v)
            }
          >
            <Text style={{ color: theme.colors.text }}>
              {intervalEnum.charAt(0) +
                intervalEnum.slice(1).toLowerCase()}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {intervalEnumDropdownVisible && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme.colors.card },
              ]}
            >
              {(
                [
                  "DAY",
                  "WEEK",
                  "MONTH",
                  "YEAR",
                  "NEVER",
                ] as const
              ).map((period) => (
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
                      period === intervalEnum
                        ? styles.dropdownTextActive
                        : undefined,
                      { color: theme.colors.text },
                    ]}
                  >
                    {period.charAt(0) +
                      period.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: !isValid || saving ? 0.4 : 1,
              },
            ]}
            disabled={!isValid || saving}
            onPress={onSave}
          >
            {saving ? (
              <ActivityIndicator
                color={theme.colors.background}
              />
            ) : (
              <Text
                style={[
                  styles.saveTxt,
                  { color: theme.colors.background },
                ]}
              >
                {mode === "create" ? "Create" : "Update"}
              </Text>
            )}
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
  flex: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { padding: 20, paddingBottom: 40 },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  dateInput: { flexDirection: "row", alignItems: "center" },

  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdown: {
    borderRadius: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  dropdownItem: { padding: 10 },
  dropdownTextActive: { fontWeight: "600" },

  saveBtn: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveTxt: {
    fontSize: 16,
    fontWeight: "600",
  },
});
