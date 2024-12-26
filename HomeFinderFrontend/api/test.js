import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { FilterProvider } from '../context/FilterContext';
import { PropertyProvider } from '../context/PropertyContext';

import HomeScreen from '../screens/HomeScreen';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import SearchFilterScreen from '../screens/SearchFilterScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AddPropertyScreen from '../screens/NewPropertyScreen';
import UserManagement from '../screens/UserManagementScreen';
import EditProperty from '../screens/EditPropertyScreen';
import UserProfile from '../screens/UserProfile';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userInfo = await SecureStore.getItemAsync('userInfo');
    setIsAuthenticated(!!userInfo);
  };

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
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Map" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="List" component={PropertyListScreen} options={{ title: 'Property Listings' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Saved Properties' }} />
      <Tab.Screen
        name="Profile"
        component={isAuthenticated ? UserProfile : UserManagement}
        options={{
          title: isAuthenticated ? 'Profile' : 'Login',
          headerShown: false
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('UserManagement');
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function App() {
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
                    options={{ title: 'Filter Properties' }}
                 />

                 <Stack.Screen
                    name="newProperty"
                    component={AddPropertyScreen}
                    options={{ title: 'New Property' }}
                 />

                 <Stack.Screen
                    name="UserManagement"
                    component={UserManagement}
                    options={{ title: 'Account' }}
                 />

                 <Stack.Screen
                    name="EditProperty"
                    component={EditProperty}
                    options={{ title: 'EditProperty' }}
                 />

                 <Stack.Screen
                    name="UserProfile"
                    component={UserProfile}
                    options={{ title: 'UserProfile' }}
                 />

              </Stack.Navigator>
            </NavigationContainer>
        </PropertyProvider>
     </FilterProvider>
  );
}