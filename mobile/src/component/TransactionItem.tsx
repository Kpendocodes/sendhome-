import React from "react";
import { View, Text, StyleSheet } from "react-native";

type TransactionItemProps = {
  tx: {
    id: string;
    note: string;
    amount: number;
  };
};

export default function TransactionItem({ tx }: TransactionItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.note}>{tx.note}</Text>
      <Text style={[styles.amount, { color: tx.amount < 0 ? "red" : "green" }]}>
        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  note: {
    fontSize: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
