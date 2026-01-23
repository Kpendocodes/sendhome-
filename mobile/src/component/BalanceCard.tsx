import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function BalanceCard({ currency, amount }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{currency} Wallet</Text>
      <Text style={styles.amount}>
        {currency} {amount.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 15
  },
  label: { color: colors.textSecondary },
  amount: { fontSize: 26, fontWeight: "700" }
});
