import { View, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router=useRouter();
  return (
    <View className="flex-1 justify-center items-center">
      <Button 
        title="Get Started"
        onPress={()=>router.push('/authScreen')}
      />
    </View>
  );
}