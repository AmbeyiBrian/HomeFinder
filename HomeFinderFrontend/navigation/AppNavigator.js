import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { FilterProvider } from '../context/FilterContext';
import { PropertyProvider } from '../context/PropertyContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import SearchFilterScreen from '../screens/SearchFilterScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AddPropertyScreen from '../screens/NewPropertyScreen';
import UserManagement from '../screens/UserManagementScreen';
import EditProperty from '../screens/EditPropertyScreen';
import UserProfile from '../screens/UserProfile';
import TermsAndConditions from '../screens/TermsConditions';
import PropertyReviews from '../components/PropertyReviews';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create a wrapper component for UserProfile tab
const UserProfileWrapper = ({ navigation }) => {
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        navigation.navigate('UserManagement');
      }
      setIsChecking(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigation.navigate('UserManagement');
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return null; // Or a loading spinner
  }

  return <UserProfile />;
};

// Bottom Tab Navigator
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'List') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'UserProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Map"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="List"
        component={PropertyListScreen}
        options={{ title: 'Property Listings' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Saved Properties' }}
      />
      <Tab.Screen
        name="UserProfile"
        component={UserProfileWrapper}
        options={{ title: 'User Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <FilterProvider>
      <PropertyProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Main"
              component={BottomTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PropertyListScreen"
              component={PropertyListScreen}
            />
            <Stack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={({ route }) => ({
                title: route.params?.property?.name || 'Property Details'
              })}
            />
            <Stack.Screen
              name="SearchFilter"
              component={SearchFilterScreen}
              options={{ title: 'Property Preferences' }}
            />
            <Stack.Screen
              name="newProperty"
              component={AddPropertyScreen}
              options={{ title: 'New Property' }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagement}
              options={{
                title: 'Account',
                headerLeft: () => null // Removes back button
              }}
            />
            <Stack.Screen
              name="EditProperty"
              component={EditProperty}
              options={{ title: 'Edit Property' }}
            />
            <Stack.Screen
              name="TermsAndConditions"
              component={TermsAndConditions}
              options={{ title: 'Terms & Conditions' }}
            />
            <Stack.Screen
              name="PropertyReviews"
              component={PropertyReviews}
            />

          </Stack.Navigator>
        </NavigationContainer>
      </PropertyProvider>
    </FilterProvider>
  );
}