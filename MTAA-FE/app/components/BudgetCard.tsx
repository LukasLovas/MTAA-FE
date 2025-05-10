import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

interface BudgetCardProps {
  id: number;
  title: string;
  currentAmount: number;
  initialAmount: number;
  percentage: number;
}

const BudgetCard = ({
  id,
  title,
  currentAmount,
  initialAmount,
  percentage,
}: BudgetCardProps) => {
  const handlePress = () => {
    // Navigácia na detail rozpočtu presne ako v TransactionsScreen
    router.push({
      pathname: "/(budgets)/budget",
      params: { 
        id,
        label: title,
        amount: currentAmount,
        initialAmount: initialAmount,
        // Ďalšie parametre možno budete chcieť pridať podľa vašich potrieb
      }
    });
  };
  
  return (
    <TouchableOpacity 
      style={styles.budgetCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.budgetTitle}>{title}</Text>
      <Text style={styles.budgetAmount}>
        €{currentAmount.toFixed(2)} left of €{initialAmount.toFixed(2)}
        <Text style={styles.percentageText}>{percentage}%</Text>
      </Text>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${percentage}%` }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  budgetCard: {
    backgroundColor: "#ECECEC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    position: "relative",
    paddingRight: 60, // Space for the percentage
  },
  percentageText: {
    position: "absolute",
    right: 0,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#D0D0D0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#333333",
    borderRadius: 4,
  },
});

export default BudgetCard;