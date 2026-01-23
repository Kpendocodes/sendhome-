import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 14,
    marginVertical: 8
  },
  text: { color: "#fff", textAlign: "center", fontWeight: "600" }
});
