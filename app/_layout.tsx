import { Stack, useRouter } from "expo-router";
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
    }, [session, loading])
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