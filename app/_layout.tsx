import { Stack } from "expo-router";
import '@/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

function RootLayoutNav() {
  return (<Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="main" options={{ headerShown: false }} />
  </Stack>);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <RootLayoutNav />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
