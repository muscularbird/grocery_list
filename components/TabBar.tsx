import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import TabBarButton from './TabBarButton';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  // width per visible tab
  const buttonWidth = dimensions.width / state.routes.length;

  const tabPositionX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: buttonWidth - 25, // your padding
      height: dimensions.height - 15,
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View
      onLayout={onTabBarLayout}
      className="absolute bottom-12 flex-row items-center justify-around bg-white rounded-full p-2 self-center w-3/4 shadow-lg"
    >
      <Animated.View
        style={animatedStyle}
        className="absolute bottom-2 bg-blue-900 rounded-full"
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
      const label =
        typeof options.tabBarLabel === "string"
          ? options.tabBarLabel
          : options.title ?? route.name;

        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          // animate highlight relative to filtered index
          tabPositionX.value = withSpring(buttonWidth * (index - 0.5), {
            duration: 800,
          });

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabBarButton
            key={route.name}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? "#FFF" : "#222"}
            label={label}
          />
        );
      })}
    </View>
  );
}