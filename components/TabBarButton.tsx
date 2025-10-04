import React, { JSX, useEffect } from "react";
import { View, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import Animated, {
  interpolate,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

export default function TabBarButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
}) {
  const icons: Record<string, (props: any) => JSX.Element> = {
    home: (props) => <MaterialIcons name="home" size={28} {...props} />,
    workflows: (props) => <Octicons name="workflow" size={24} {...props} />,
    profile: (props) => <AntDesign name="user" size={28} {...props} />,
  };

  const AnimatedView = Animated.createAnimatedComponent(View);

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
    const top = interpolate(scale.value, [0, 1], [0, 7]);
    return {
      transform: [{ scale: scaleValue }],
      top,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return { opacity };
  });

  return (
    <View>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        className="flex justify-center items-center"
      >
        <AnimatedView style={animatedIconStyle}>
          {icons[routeName] ? icons[routeName]({ color }) : null}
        </AnimatedView>
        <Animated.Text
          style={[
            { color: isFocused ? "#FFF" : "#222", fontSize: 12 },
            animatedTextStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Pressable>
    </View>
  );
}
