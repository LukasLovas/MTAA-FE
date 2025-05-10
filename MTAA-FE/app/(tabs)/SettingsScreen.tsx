import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import AppHeader from "../header/AppHeader";
import { ThemeContext } from "../../contexts/ThemeContext";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [notifUpcoming, setNotifUpcoming] = useState(false);
  const [notifSubscription, setNotifSubscription] = useState(false);
  const [notifBudget, setNotifBudget] = useState(false);
  const [permCamera, setPermCamera] = useState(false);
  const [permStorage, setPermStorage] = useState(false);
  const [permLocation, setPermLocation] = useState(false);

  const [currency, setCurrency] = useState<string>("EUR");
  const [currencyDropdownVisible, setCurrencyDropdownVisible] =
    useState(false);
  const currencyOptions = [
    "BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
    "HKD","HRK","HUF","IDR","ILS","INR","ISK","JPY","KRW",
    "MXN","MYR","NOK","NZD","PHP","PLN","RON","RUB","SEK",
    "SGD","THB","TRY","USD","ZAR",
  ];

  const renderSection = (
    title: string,
    isOpen: boolean,
    onToggle: () => void,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <Text style={styles.headerText}>{title}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#000"
        />
      </TouchableOpacity>
      {isOpen && 
        <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
          {children}
        </View>
      }
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Settings",
          headerRight: () => <AppHeader />,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTitleStyle: { color: theme.colors.text },
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {renderSection(
          "Appearance",
          appearanceOpen,
          () => setAppearanceOpen(!appearanceOpen),
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Dark mode</Text>
            <Switch
              value={theme.dark}
              onValueChange={toggleTheme}
              thumbColor={theme.colors.primary}
              trackColor={{ false: "#d0d0d0", true: "#d0d0d0" }}
            />
          </View>
        )}

        {renderSection(
          "Notifications",
          notificationsOpen,
          () => setNotificationsOpen(!notificationsOpen),
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Upcoming transactions</Text>
              <Switch
                value={notifUpcoming}
                onValueChange={setNotifUpcoming}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Subscription reminder</Text>
              <Switch
                value={notifSubscription}
                onValueChange={setNotifSubscription}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Exceeding Budget</Text>
              <Switch
                value={notifBudget}
                onValueChange={setNotifBudget}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
          </>
        )}

        {renderSection(
          "Permissions",
          permissionsOpen,
          () => setPermissionsOpen(!permissionsOpen),
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Camera</Text>
              <Switch
                value={permCamera}
                onValueChange={setPermCamera}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Storage</Text>
              <Switch
                value={permStorage}
                onValueChange={setPermStorage}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
              <Switch
                value={permLocation}
                onValueChange={setPermLocation}
                thumbColor={theme.colors.primary}
                trackColor={{ false: "#fff", true: theme.colors.primary }}
              />
            </View>
          </>
        )}

        {renderSection(
          "Currency",
          currencyOpen,
          () => setCurrencyOpen(!currencyOpen),
          <View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Currency</Text>
              <TouchableOpacity
                style={styles.dropdownToggle}
                onPress={() => setCurrencyDropdownVisible(!currencyDropdownVisible)}
              >
                <Text style={[styles.label, { color: theme.colors.text }]}>{currency}</Text>
                <Ionicons
                  name={currencyDropdownVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
            {currencyDropdownVisible && (
              <View style={styles.optionList}>
                {currencyOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionItem}
                    onPress={() => {
                      setCurrency(opt);
                      setCurrencyDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  section: {
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#d0d0d0",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  body: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#000",
  },
  dropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionList: {
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    paddingVertical: 4,
    marginTop: 4,
  },
  optionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
    color: "#000",
  },
});
