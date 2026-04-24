import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="animals"
        options={{ title: 'Animaux', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="care"
        options={{ title: 'Soins', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="vaccinations"
        options={{ title: 'Vaccins', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Alertes', tabBarIcon: () => null }}
      />
    </Tabs>
  )
}
