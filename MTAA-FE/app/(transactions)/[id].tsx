import React, { useState, useMemo, useEffect, useContext } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { api } from "@/service/apiClient";
import { ThemeContext } from "@/contexts/ThemeContext";

type Mode = "create" | "edit";
const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) =>
  `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

const grey = "#D9D9D9";

export default function TransactionFormScreen() {
  const { theme } = useContext(ThemeContext);
  const params = useLocalSearchParams<{
    id: string;
    label: string;
    amount: string;
    creationDate: string;
    transactionTypeEnum: string;
    category: string;
    budget: string;
    location: string;
    frequencyEnum: string;
    note: string;
    filename: string;
    currency: string;
  }>();
  const mode: Mode =
    params.id && params.id !== "new" ? "edit" : "create";

  const categories = [
    "Food",
    "Transport",
    "Entertainment",
    "Health",
    "Shopping",
    "Other",
  ];
  const budgets = [
    "Budget 1",
    "Budget 2",
    "Budget 3",
    "Budget 4",
    "Budget 5",
  ];

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] =
    useState(false);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [frequency, setFrequency] =
    useState<"DEFAULT" | "UPCOMING" | "SUBSCRIPTION">(
      "DEFAULT"
    );
  const [note, setNote] = useState("");
  const [
    attachment,
    setAttachment,
  ] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit") {
      setTitle(params.label ?? "");
      setAmount(params.amount ?? "");
      setType(
        params.transactionTypeEnum as "EXPENSE" | "INCOME"
      );
      setDate(new Date(params.creationDate ?? ""));
      setCategory(params.category ?? "");
      setBudget(params.budget ?? "");
      setLocation(params.location ?? "");
      setFrequency(
        (params.frequencyEnum as any) ?? "DEFAULT"
      );
      setNote(params.note ?? "");
      setAttachment(
        params.filename
          ? ({ uri: params.filename } as ImagePicker.ImagePickerAsset)
          : null
      );
    }
  }, []);

  const isValid =
    title.trim().length &&
    amount.trim().length &&
    amount.trim() !== "0" &&
    !isNaN(Number(amount)) &&
    date != null &&
    category.trim().length > 0 &&
    budget.trim().length > 0;

  const formattedDate = useMemo(
    () => (date ? formatDate(date) : "Date"),
    [date]
  );

  const [categoryDropDownVisible, setCategoryDropDownVisible] =
    useState(false);
  const [budgetDropDownVisible, setBudgetDropDownVisible] =
    useState(false);

  const pickAttachment = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!res.canceled) setAttachment(res.assets[0]);
  };

  const onSave = async () => {
    if (!isValid)
      return Alert.alert("Please fill Title and Amount.");
    setSaving(true);

    const payload = {
      user_id: 2,
      label: title,
      amount:
        Number(amount) * (type === "EXPENSE" ? -1 : 1),
      time: (date ?? new Date()).toISOString(),
      transaction_type: type,
      category_id: 2,
      budget_id: 1,
      location_id: 1,
      frequency,
      note,
      filename: "string",
      currency_code: "EUR",
    };

    try {
      // await mode==='create' ? api.post(...) : api.put(...)
      router.back();
    } catch (e) {
      Alert.alert("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle:
            mode === "create"
              ? "New Transaction"
              : "Edit Transaction",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
          headerTintColor: theme.colors.text,
        }}
      />

      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              flexGrow: 1,
              backgroundColor: theme.colors.background,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Expense / Income toggle */}
          <View
            style={[
              styles.segment,
              { backgroundColor: theme.colors.border },
            ]}
          >
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor:
                      type === t
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        type === t
                          ? theme.colors.background
                          : theme.colors.text,
                    },
                  ]}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <TextInput
            placeholder="Title"
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

          {/* Date & Amount */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                },
              ]}
              onPress={() => setDatePickerVisible(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.colors.text}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: date
                    ? theme.colors.text
                    : theme.colors.border,
                }}
              >
                {formattedDate}
              </Text>
            </TouchableOpacity>

            <TextInput
              placeholder="€0"
              placeholderTextColor={theme.colors.border}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  marginLeft: 10,
                  flex: 1,
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                },
              ]}
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Location */}
          <TextInput
            placeholder="Choose location"
            placeholderTextColor={theme.colors.border}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            value={location}
            onChangeText={setLocation}
          />

          {/* Category dropdown */}
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              setCategoryDropDownVisible(
                !categoryDropDownVisible
              )
            }
          >
            <Text
              style={{
                color: category
                  ? theme.colors.text
                  : theme.colors.border,
              }}
            >
              {category || "Category"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.colors.text}
              style={{ position: "absolute", right: 12, top: 16 }}
            />
          </TouchableOpacity>
          {categoryDropDownVisible && (
            <View
              style={{
                backgroundColor: theme.colors.border,
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCategory(c);
                    setCategoryDropDownVisible(false);
                  }}
                >
                  <Text style={{ padding: 10, color: theme.colors.text }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Budget dropdown */}
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              setBudgetDropDownVisible(
                !budgetDropDownVisible
              )
            }
          >
            <Text
              style={{
                color: budget
                  ? theme.colors.text
                  : theme.colors.border,
              }}
            >
              {budget || "Budget"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.colors.text}
              style={{ position: "absolute", right: 12, top: 16 }}
            />
          </TouchableOpacity>
          {budgetDropDownVisible && (
            <View
              style={{
                backgroundColor: theme.colors.border,
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              {budgets.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => {
                    setBudget(b);
                    setBudgetDropDownVisible(false);
                  }}
                >
                  <Text style={{ padding: 10, color: theme.colors.text }}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Frequency pills */}
          <View style={styles.freqRow}>
            {(
              ["DEFAULT", "UPCOMING", "SUBSCRIPTION"] as const
            ).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFrequency(f)}
                style={[
                  styles.freqPill,
                  {
                    backgroundColor:
                      frequency === f
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.freqText,
                    {
                      color:
                        frequency === f
                          ? theme.colors.background
                          : theme.colors.text,
                    },
                  ]}
                >
                  {f === "DEFAULT" ? "Default" : f.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <TextInput
            placeholder="Notes"
            placeholderTextColor={theme.colors.border}
            style={[
              styles.input,
              {
                height: 100,
                textAlignVertical: "top",
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            multiline
            value={note}
            onChangeText={setNote}
          />

          {/* Attachment */}
          <TouchableOpacity
            style={[
              styles.attachRow,
              {
                borderColor: theme.colors.border,
              },
            ]}
            onPress={pickAttachment}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="paperclip"
                size={16}
                color={theme.colors.text}
              />
              <Text style={{ marginLeft: 6, color: theme.colors.text }}>
                {attachment
                  ? attachment.fileName
                  : "Add attachment"}
              </Text>
              {attachment && (
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={16}
                  color={theme.colors.text}
                  style={{ marginLeft: 12 }}
                  onPress={() => setAttachment(null)}
                />
              )}
            </View>
            <Ionicons
              name="add"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: theme.colors.primary,
              },
              !isValid && { opacity: 0.4 },
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
                Save
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
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
  segment: {
    flexDirection: "row",
    borderRadius: 999,
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
  },
  segmentText: { fontWeight: "500" },

  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },

  row: { flexDirection: "row" },

  freqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  freqPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    marginHorizontal: 4,
  },
  freqText: { fontSize: 13 },

  attachRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    marginBottom: 24,
  },

  saveBtn: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveTxt: { fontSize: 16, fontWeight: "600" },
});
