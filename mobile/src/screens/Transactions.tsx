import { View, Text, Button } from "react-native";

export default function Transactions({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Transactions Screen</Text>
      <Button title="Back to Wallet" onPress={() => navigation.goBack()} />
    </View>
  );
}
