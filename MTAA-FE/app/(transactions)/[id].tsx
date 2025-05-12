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
  Modal
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { api, getUserIdFromToken } from "@/service/apiClient";
import { ThemeContext } from "@/contexts/ThemeContext";

type Mode = "create" | "edit";
const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) =>
  `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

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

  const [categories, setCategories] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<string[]>([]);

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
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

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data.map((c: any) => c.label));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  const fetchBudgets = async () => {
    try {
      const { data } = await api.get("/budgets/byUsername");
      setBudgets(data.map((b: any) => b.label));
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();

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
      params.filename === "" 
      ? setAttachment(null) 
      : setAttachment({ uri: params.filename } as ImagePicker.ImagePickerAsset);
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
  const [currencyDropDownVisible, setCurrencyDropDownVisible] =
    useState(false);
  const currencyOptions = [
    "BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
    "HKD","HRK","HUF","IDR","ILS","INR","ISK","JPY","KRW",
    "MXN","MYR","NOK","NZD","PHP","PLN","RON","RUB","SEK",
    "SGD","THB","TRY","USD","ZAR",
  ];

  const [locPickerOpen, setLocPickerOpen] = useState(false);
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);

  const pickAttachment = async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "We need camera roll permissions to proceed!");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });
      
      if (!res.canceled) {
        setAttachment(res.assets[0]);
      } 

  };

  const [categoryModalVisible, setCategoryModalVisible] =
    useState(false);
  const [categoryName, setCategoryName] = useState("");

  const addCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Please enter a category name");
      return;
    }

    try {
      const { data } = await api.post("/category", {
        user_id: await getUserIdFromToken(),
        label: categoryName,
      });
      setCategories((prev) => [...prev, data.label]);
      setCategory(data.label);
      setCategoryModalVisible(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  }

  const onSave = async () => {
    if (!isValid)
      return Alert.alert("Please fill Title and Amount.");
    setSaving(true);

    let locationId = null;

    if (coords) {
      const { lat, lng } = coords;
      const { data } = await api.post("/location", {
        name: location,
        latitude: lat,
        longitude: lng,
      });
      locationId = data.id;
    }

    let generatedFilename = "";

    if (attachment && mode === "create") {
      const { uri, type } = attachment; 
      const extension = uri.split(".").pop();
      let mimeType = type || `image/${extension}`;
      const uuid = await Crypto.randomUUID();
      generatedFilename = `${uuid}.${extension}`;

      const localUri = `${FileSystem.cacheDirectory}${generatedFilename}`;
      
      await FileSystem.copyAsync({ from: uri, to: localUri });

      if (mimeType === "image") {
        if (extension === "jpg" || extension === "jpeg") {
          mimeType = "image/jpeg";
        }
        else if (extension === "png") {
          mimeType = "image/png";
        } else if (extension === "svg") {
          mimeType = "image/svg+xml";
        }
      }

      const signedUrlResponse = await api.get(
        "images/generate-upload-url",
        {
          params: {
            filename: generatedFilename,
            contentType: mimeType,
          },
        }
      )

      if (!signedUrlResponse.data) {
        Alert.alert("Failed to generate upload URL");
        return;
      }
      const { uploadUrl } = signedUrlResponse.data;
      
      const uploadRes = await FileSystem.uploadAsync(uploadUrl, localUri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": mimeType || "image/jpeg",
        },
      });

      if (uploadRes.status !== 200 && uploadRes.status !== 201) {
        throw new Error("Upload to Firebase failed");
      }

    }

    const userId = await getUserIdFromToken();

    const payload = {
      user_id: userId,
      label: title,
      amount: Number(amount),
      time: date?.toISOString(),
      transaction_type: type,
      category,
      budget,
      location_id: locationId,
      frequency,
      note,
      filename: generatedFilename,
      currency_code: currency,
    };

    try {
      if (mode === "create") {
        await api.post("/transactions", payload);
      } else {
        await api.put(`/transactions/${params.id}`, payload);
      }
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
              placeholder="0"
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

          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.colors.card }]}
            onPress={() =>
              setCurrencyDropDownVisible(
                !currencyDropDownVisible
              )
            }
          >
            <Text
              style={{
                color: currency
                  ? theme.colors.text
                  : theme.colors.border,
              }}
            >
              {currency || "Currency"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.colors.text}
              style={{ position: "absolute", right: 12, top: 16 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.colors.card }]}
            onPress={() => setLocPickerOpen(true)}
          >
            <Text style={{ color: location ? theme.colors.text : theme.colors.border }}>
              {location || "Choose location"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text}
                      style={{ position: "absolute", right: 12, top: 16 }} />
          </TouchableOpacity>

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
              <TouchableOpacity
                onPress={() => {
                  setCategoryDropDownVisible(false);
                  setCategoryModalVisible(true);
                }}
                style={{
                  padding: 10,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{ color: theme.colors.text, fontWeight: "500" }}
                >
                  + Add new category
                </Text>
              </TouchableOpacity>
            </View>
          )}

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

      <Modal
        animationType="slide"
        visible={locPickerOpen}
        onRequestClose={() => setLocPickerOpen(false)}
      >
        <View 
          style={{ flex: 1, paddingTop: 60, backgroundColor: theme.colors.background }}
        >
          <TouchableOpacity
            style={{ padding: 14, alignSelf: "flex-end", marginRight: 10 }}
            onPress={async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert("Permission denied", "Location permission is required.");
                  return;
                }
                const pos = await Location.getCurrentPositionAsync({});
                const [place] = await Location.reverseGeocodeAsync(pos.coords);
                const label =
                  `${place.name ?? ""} ${place.street ?? ""}`.trim() ||
                  `${place.postalCode ?? ""} ${place.city ?? ""}`.trim();
                setLocation(label);
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocPickerOpen(false); 
              } catch (err) {
                Alert.alert("Could not fetch location");
              }
            }}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>Use my location</Text>
          </TouchableOpacity>

          <GooglePlacesAutocomplete
            keyboardShouldPersistTaps="handled"
            placeholder="Search places"
            minLength={2}
            timeout={15000}
            query={{ key: 'AIzaSyCORMAw3XAay-4Rl6ZglaCwwEzc0V1XR7U', language: "en" }} // Todo: hide this key
            onPress={({ description }, details) => { 
              setLocation(description); 
              if (details?.geometry?.location) {
                setCoords(details.geometry.location);
              } else {
                setCoords(null);
              }
              setLocPickerOpen(false); 
            }}
            onFail={err => {
              console.log('[Places] error', err);    
              Alert.alert('Places error', JSON.stringify(err, null, 2));
            }}
            onNotFound={() => {
              console.log('[Places] zero results');
            }}

            predefinedPlaces={[]}
            textInputProps={{}}
            fetchDetails={true}
            styles={{
              textInput: {
                height: 48,
                borderRadius: 8,
                paddingHorizontal: 14,
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
              listView: { backgroundColor: theme.colors.card },
            }}
          />
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.background }}>
          <TextInput
            placeholder="Category name"
            placeholderTextColor={theme.colors.border}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
              },
            ]}
            value={categoryName}
            onChangeText={setCategoryName}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
            onPress={addCategory}
          >
            <Text style={[styles.saveTxt, { color: theme.colors.background }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={currencyDropDownVisible}
        onRequestClose={() => setCurrencyDropDownVisible(false)}
      >
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: theme.colors.background }}>
          {currencyOptions.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                setCurrency(c);
                setCurrencyDropDownVisible(false);
              }}
            >
              <Text style={{ padding: 10, color: theme.colors.text }}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
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
