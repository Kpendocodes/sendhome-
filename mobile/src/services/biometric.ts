import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export async function authenticate() {
  return LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock SendHome"
  });
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}

export async function getToken() {
  return SecureStore.getItemAsync("token");
}
