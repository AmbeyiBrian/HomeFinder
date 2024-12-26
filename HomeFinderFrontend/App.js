import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './redux/store'; // Import your Redux store
import AppNavigator from './navigation/AppNavigator'; // Main navigator
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
        <Provider store={store}>
            <AppNavigator />
        </Provider>
    </SafeAreaProvider>
  );
};

export default App;
