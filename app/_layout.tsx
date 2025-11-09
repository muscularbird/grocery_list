import { Slot, Stack } from "expo-router";
import '@/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ThemeProvider } from "@/utils/ThemeProvider";

function RootLayoutNav() {
  return (<Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="main" options={{ headerShown: false }} />
  </Stack>);
}

export default function RootLayout() {

  const [loaded] = useFonts({
    'Nunito': require('../assets/fonts/Nunito-VariableFont_wght.ttf'),
  })
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Slot />
        </SafeAreaView>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
