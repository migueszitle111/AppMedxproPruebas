/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
/*import { SafeAreaView, StyleSheet } from 'react-native';*/
import { WebView } from 'react-native-webview';

function App(): JSX.Element {

  return (
    <WebView source={{ uri: 'http://www.medxproapp.com' }} style={{ flex: 1 }}/>
  );

}

export default App;
