import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AuthProvider, useAuth } from "@/utils/AuthProvider";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { ThemeProvider } from "@/utils/ThemeProvider";
import "@/global.css"

function RootNavigation() {
    const { session, loading } = useAuth();

    const router = useRouter();

    useEffect(() => {

        if (loading) return;

        if (session) {
            router.replace('/main/home')
        }
        else {
            router.replace('/(auth)/authScreen')
        }
    }, [session, loading, router])
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator color={"blue"} size={"large"} />
            </View>
        )
    }
    return <Stack screenOptions={{ headerShown: false }} />
}
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
    ...Ionicons.font,
    ...Feather.font,
  });

  if (!fontsLoaded) {
    return null;
  }

    return (
      <AuthProvider>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} className="bg-background">
              <RootNavigation />
            </SafeAreaView>
            <Toast />
          </GestureHandlerRootView>
        </ThemeProvider>
      </AuthProvider>
    )
}