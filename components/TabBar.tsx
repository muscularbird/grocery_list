import React, { useEffect, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import TabBarButton from './TabBarButton';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState({ width: 320, height: 56 });
  const tabPositionX = useSharedValue(0);

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const buttonCount = Math.max(1, state.routes.length);
  const buttonWidth = dimensions.width / buttonCount;
  const indicatorPadding = 25;                 // keep your padding idea
  const indicatorWidth = Math.max(10, buttonWidth - indicatorPadding);
  const indicatorHeight = Math.max(30, dimensions.height - 15);

  // whenever layout or active index changes, move the indicator
  useEffect(() => {
    if (!dimensions.width) return;
    const centerOffset = (buttonWidth - indicatorWidth) / 2;
    const targetX = buttonWidth * state.index + centerOffset;
    tabPositionX.value = withSpring(targetX, { stiffness: 10 });
  }, [dimensions.width, state.index]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    width: indicatorWidth,
    height: indicatorHeight,
    transform: [{ translateX: tabPositionX.value }],
  }));

  return (
    <View
      onLayout={onTabBarLayout}
      style={{
        position: 'absolute',
        bottom: 12,
        alignSelf: 'center',
        width: '75%',
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 999,
        padding: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* animated bubble */}
      <Animated.View
        style={[
          animatedStyle,
          { bottom: 8, backgroundColor: '#0b3b82', borderRadius: 999 },
        ]}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const centerOffset = (buttonWidth - indicatorWidth) / 2;
          const targetX = buttonWidth * index + centerOffset;
          tabPositionX.value = withSpring(targetX, { damping: 16, stiffness: 140 });

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabBarButton
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? '#FFF' : '#222'}
            label={label}
          />
        );
      })}
    </View>
  );
}
