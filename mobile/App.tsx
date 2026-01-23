import "react-native-gesture-handler";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

type RootStackParamList = {
  Login: undefined;
  Wallet: undefined;
  Transfer: undefined;
  Transactions: undefined;
};

type Tx = {
  id: string;
  type: "send" | "receive";
  to?: string;
  from?: string;
  amount: number;
  note?: string;
  createdAt: number;
};

const Stack = createStackNavigator<RootStackParamList>();

const TOKEN_KEY = "sendhome_token_v1";
const TX_KEY = "sendhome_transactions_v1";
const BAL_KEY = "sendhome_balance_v1";

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function authenticate() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      // allow simulation on devices/emulators without biometrics
      return { success: true, skipped: true as const };
    }

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to open SendHome",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    return { success: !!res.success, skipped: false as const };
  } catch {
    // don’t hard-crash—treat as failed auth
    return { success: false, skipped: false as const };
  }
}

async function loadNumber(key: string, fallback: number) {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

async function saveNumber(key: string, value: number) {
  await SecureStore.setItemAsync(key, String(value));
}

async function loadTxs(): Promise<Tx[]> {
  const raw = await SecureStore.getItemAsync(TX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Tx[];
  } catch {
    return [];
  }
}

async function saveTxs(txs: Tx[]) {
  await SecureStore.setItemAsync(TX_KEY, JSON.stringify(txs));
}

function formatMoney(n: number) {
  // simple formatting for a simulator
  return `$${n.toFixed(2)}`;
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.h1}>{title}</Text>
      {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
  );
}

function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn2, pressed && { opacity: 0.85 }]}>
      <Text style={styles.btn2Text}>{title}</Text>
    </Pressable>
  );
}

function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("ken@example.com");
  const [pin, setPin] = useState("1234");
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (!email.trim() || pin.trim().length < 4) {
      Alert.alert("Missing info", "Enter an email and a 4+ digit PIN.");
      return;
    }
    setBusy(true);
    try {
      // In a real app you'd verify via API. Here we simulate by generating a token.
      const token = `token_${Date.now()}`;
      await setToken(token);

      // seed demo balance/txs if empty
      const existingTxs = await loadTxs();
      if (existingTxs.length === 0) {
        const seed: Tx[] = [
          { id: `tx_${Date.now()}_1`, type: "receive", from: "Payday", amount: 250.0, note: "Demo deposit", createdAt: Date.now() - 86400000 },
        ];
        await saveTxs(seed);
      }
      const bal = await loadNumber(BAL_KEY, NaN);
      if (!Number.isFinite(bal)) {
        await saveNumber(BAL_KEY, 250.0);
      }

      navigation.reset({ index: 0, routes: [{ name: "Wallet" }] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="SendHome" subtitle="Simulation login (SecureStore token + optional biometrics)" />

      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

      <Text style={styles.label}>PIN</Text>
      <TextInput value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry style={styles.input} />

      <PrimaryButton title={busy ? "Signing in..." : "Sign in"} onPress={doLogin} />
      <Text style={styles.tip}>this is a simulator.</Text>
    </SafeAreaView>
  );
}

function WalletScreen({ navigation }: any) {
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);

  const refresh = async () => {
    const [b, t] = await Promise.all([loadNumber(BAL_KEY, 250.0), loadTxs()]);
    setBalance(b);
    setTxs(t.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  const logout = async () => {
    await clearToken();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const recent = useMemo(() => txs.slice(0, 3), [txs]);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Wallet" subtitle="Your balance + quick actions" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Available Balance</Text>
        <Text style={styles.balance}>{formatMoney(balance)}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Send Money" onPress={() => navigation.navigate("Transfer")} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Transactions" onPress={() => navigation.navigate("Transactions")} />
        </View>
      </View>

      <View style={{ height: 16 }} />

      <Text style={styles.h2}>Recent</Text>
      {recent.length === 0 ? (
        <Text style={styles.sub}>No transactions yet.</Text>
      ) : (
        <View style={styles.listCard}>
          {recent.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <Text style={styles.rowLeft}>
                {tx.type === "send" ? "Sent" : "Received"} • {new Date(tx.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.rowRight}>
                {tx.type === "send" ? "-" : "+"}
                {formatMoney(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ flex: 1 }} />

      <SecondaryButton title="Log out" onPress={logout} />
    </SafeAreaView>
  );
}

function TransferScreen({ navigation }: any) {
  const [to, setTo] = useState("Mom");
  const [amount, setAmount] = useState("25");
  const [note, setNote] = useState("Groceries");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const amt = Number(amount);
    if (!to.trim() || !Number.isFinite(amt) || amt <= 0) {
      Alert.alert("Invalid transfer", "Enter a recipient and a valid amount.");
      return;
    }

    setBusy(true);
    try {
      const bal = await loadNumber(BAL_KEY, 250.0);
      if (amt > bal) {
        Alert.alert("Insufficient funds", `You only have ${formatMoney(bal)} available.`);
        return;
      }

      const tx: Tx = {
        id: `tx_${Date.now()}`,
        type: "send",
        to: to.trim(),
        amount: amt,
        note: note.trim(),
        createdAt: Date.now(),
      };

      const nextBal = bal - amt;
      const txs = await loadTxs();
      const nextTxs = [tx, ...txs];

      await Promise.all([saveNumber(BAL_KEY, nextBal), saveTxs(nextTxs)]);

      Alert.alert("Sent!", `You sent ${formatMoney(amt)} to ${tx.to}.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Transfer" subtitle="Simulate sending money" />

      <Text style={styles.label}>To</Text>
      <TextInput value={to} onChangeText={setTo} style={styles.input} />

      <Text style={styles.label}>Amount</Text>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} />

      <Text style={styles.label}>Note</Text>
      <TextInput value={note} onChangeText={setNote} style={styles.input} />

      <PrimaryButton title={busy ? "Sending..." : "Send"} onPress={send} />
      <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

function TransactionsScreen({ navigation }: any) {
  const [txs, setTxs] = useState<Tx[]>([]);

  const refresh = async () => {
    const t = await loadTxs();
    setTxs(t.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  const clearAll = async () => {
    Alert.alert("Clear all?", "This deletes all simulated transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await saveTxs([]);
          await saveNumber(BAL_KEY, 0);
          await refresh();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Transactions" subtitle="History (simulated, stored locally)" />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Back" onPress={() => navigation.goBack()} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Clear all" onPress={clearAll} />
        </View>
      </View>

      <View style={{ height: 12 }} />

      <FlatList
        data={txs}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.sub}>No transactions.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txTop}>
              <Text style={styles.txTitle}>
                {item.type === "send" ? `Sent to ${item.to ?? "—"}` : `Received from ${item.from ?? "—"}`}
              </Text>
              <Text style={styles.txAmt}>
                {item.type === "send" ? "-" : "+"}
                {formatMoney(item.amount)}
              </Text>
            </View>
            <Text style={styles.txMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            {!!item.note && <Text style={styles.txNote}>{item.note}</Text>}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setReady(true);
        return;
      }
      const bio = await authenticate();
      if (bio.success) setLoggedIn(true);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
  <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loggedIn ? (
          <>
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Transfer" component={TransferScreen} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#0b1220" },
  h1: { fontSize: 28, fontWeight: "800", color: "white" },
  h2: { fontSize: 18, fontWeight: "800", color: "white", marginBottom: 8 },
  sub: { color: "rgba(255,255,255,0.75)", marginTop: 4 },
  label: { color: "rgba(255,255,255,0.8)", marginTop: 10, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "white",
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#0A7CFF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800", fontSize: 16 },
  btn2: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },
  btn2Text: { color: "white", fontWeight: "700", fontSize: 16 },
  tip: { marginTop: 10, color: "rgba(255,255,255,0.65)" },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: { color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  balance: { color: "white", fontSize: 34, fontWeight: "900", marginTop: 6 },
  listCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  rowLeft: { color: "rgba(255,255,255,0.85)", fontWeight: "600", width: "72%" },
  rowRight: { color: "white", fontWeight: "900" },
  txCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    marginBottom: 10,
  },
  txTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  txTitle: { color: "white", fontWeight: "800", flex: 1 },
  txAmt: { color: "white", fontWeight: "900" },
  txMeta: { marginTop: 6, color: "rgba(255,255,255,0.7)" },
  txNote: { marginTop: 6, color: "rgba(255,255,255,0.85)" },
});
