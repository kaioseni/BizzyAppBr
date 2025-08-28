import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Settings } from "lucide-react-native";
import HomeScreen from "../screens/HomeScreen";
import MoreScreen from "../screens/MoreScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, tabBarActiveTintColor: "#329de4", tabBarInactiveTintColor: "#777",
                tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 0, elevation: 4 },
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Início", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />

            <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: "Mais", tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
            
        </Tab.Navigator>
    );
}
