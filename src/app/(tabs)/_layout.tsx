import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontFamily: Fonts.heading },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontFamily: Fonts.body },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="collection"
        options={{ title: 'Collezione', tabBarIcon: ({ color }) => <TabIcon symbol="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="trade"
        options={{ title: 'Scambio', tabBarIcon: ({ color }) => <TabIcon symbol="🔄" color={color} /> }}
      />
      <Tabs.Screen
        name="about"
        options={{ title: 'Info', tabBarIcon: ({ color }) => <TabIcon symbol="ℹ️" color={color} /> }}
      />
    </Tabs>
  );
}
