import { View, Text, Button } from "react-native";

export default function Wallet({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Wallet Screen</Text>
      <Button title="Go to Transactions" onPress={() => navigation.navigate("Transactions")} />
      <Button title="Go to Transfer" onPress={() => navigation.navigate("Transfer")} />
    </View>
  );
}
