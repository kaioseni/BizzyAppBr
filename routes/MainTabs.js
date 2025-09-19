import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Settings } from "lucide-react-native";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import HomeScreen from "../screens/HomeScreen";
import MoreScreen from "../screens/MoreScreen";

const Tab = createBottomTabNavigator();
const APP_BLUE = "#329de4";

export default function MainTabs() {
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_BLUE,
        tabBarInactiveTintColor: currentTheme.textSecondary || "#777",
        tabBarStyle: {
          backgroundColor: currentTheme.tabBar || currentTheme.card,
          borderTopWidth: 0,
          elevation: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: "Mais",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
