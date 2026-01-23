import { View, Text, Button } from "react-native";

export default function Transfer({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Transfer Screen</Text>
      <Button title="Back to Wallet" onPress={() => navigation.goBack()} />
    </View>
  );
}
