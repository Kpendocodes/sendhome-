import { View, Text, Button } from "react-native";
import { saveToken } from "../services/biometric";

export default function Login({ navigation }) {
  const login = async () => {
    // Save a demo token
    await saveToken("demo-token");
    // Navigate to Wallet
    navigation.replace("Wallet");
  };

  return (
    <View style={{ padding: 40 }}>
      <Text style={{ fontSize: 24 }}>SendHome</Text>
      <Button title="Login (Demo)" onPress={login} />
    </View>
  );
}
