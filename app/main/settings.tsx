import { Text, View, Pressable } from "react-native";
import ThemeToggle from "@/components/themeToggle";
import showToast from "@/utils/showToast";
import { supabase } from "@/utils/supabase";

export default function Settings() {
    return (<View className="flex-1 m-auto items-center bg-background w-full">
        <Text className="text-text text-2xl">Settings</Text>
        <View className="h-8 flex-row items-center justify-between w-3/4 mt-10">
            <Text className="text-text text-xl">Dark Mode</Text>
            <ThemeToggle />
        </View>
        <Pressable onPress={async () => {
            await supabase.auth.signOut();
            showToast('success', 'Success', 'Signed out successfully.');
        }}>
            <Text className="text-text text-xl mt-10">Sign Out</Text>
        </Pressable>
    </View>);
}
