/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';

import Gifinicio from './src/screens/Gifinicio';
import PantallaInicio from './src/screens/PantallaInicio';
import Login from './src/screens/Autenticacion/Login';
import Registro from './src/screens/Autenticacion/Registro';
import AuthLoading from './src/screens/Autenticacion/AuthLoading';
import ResetPassword from './src/screens/ResetPassword';
import NavMenuReporte from './src/navigation/NavMenuReporte';
import AuthChoice from './src/screens/Autenticacion/AuthChoice';

import { IOS_CLIENT_ID, WEB_CLIENT_ID, ANDROID_CLIENT_ID } from './src/constants/key';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import Terminos from './src/screens/Autenticacion/Terminos';
import VerificacionUsuario from './src/screens/Autenticacion/VerificacionUsuario';

const Stack = createNativeStackNavigator<RootStackParamList>();

GoogleSignin.configure({
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
  scopes: ['email', 'profile'],
  forceCodeForRefreshToken: false,
  offlineAccess: true,
});

const App = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} >
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Gifinicio"
            screenOptions={{ headerShown: false }}>

              <Stack.Screen name="Gifinicio" component={Gifinicio} />
              <Stack.Screen name="AuthLoading" component={AuthLoading} />
              <Stack.Screen name="AuthChoice" component={AuthChoice} />
              <Stack.Screen name="Home" component={PantallaInicio} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Registro" component={Registro} />
              <Stack.Screen name="ResetPassword" component={ResetPassword} />
              <Stack.Screen name="Terminos" component={Terminos} />
              <Stack.Screen name="VerificacionUsuario" component={VerificacionUsuario} />
              <Stack.Screen name="MainLayout" component={NavMenuReporte} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default App;
