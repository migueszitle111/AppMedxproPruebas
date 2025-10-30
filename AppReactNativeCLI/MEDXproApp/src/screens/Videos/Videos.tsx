import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { videos, VideoItem } from './videos_info';
import VideosCard from '../Videos/VideosCard';
import Header from '../../components/Header';
import { WebView } from 'react-native-webview';
import BASE_URL from '../../constants/config';

const { width, height } = Dimensions.get('window');

function Videos(): React.JSX.Element {
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);

  return (
    <View style={styles.container}>
      <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />

      <FlatList
        data={videos}
        renderItem={({ item }) => <VideosCard item={item} onSelect={setSelected} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 15 }}
      />

      {/* Overlay con el reproductor */}
      {selected && (
        <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={styles.overlayBg} />
        </TouchableWithoutFeedback>

        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{selected.titulo}</Text>

          <View style={styles.videoContainer}>
            {isLoadingVideo && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#E65800" />
              </View>
            )}

            <WebView
              source={{ uri: `${BASE_URL}/embed/${selected.videoId}` }}
              style={styles.webview}
              javaScriptEnabled
              allowsFullscreenVideo
              setSupportMultipleWindows={false} // evita abrir ventanas externas (Android)
              originWhitelist={['*']}
              onLoadStart={() => setIsLoadingVideo(true)}
              onLoadEnd={() => setIsLoadingVideo(false)}
              onShouldStartLoadWithRequest={(request) => {
                // Bloquea cualquier navegación fuera del video embebido
                // Evita cualquier redirección fuera de tu dominio
                if (Platform.OS === 'android'){
                  if (request.url.startsWith(`${BASE_URL}`)) return true;
                  return false;
                } else {
                  //iOS permite dominio actual y youtube
                  const allowedHosts = [
                    BASE_URL,
                    'https://www.youtube-nocookie.com',
                  ];

                  const isAllowed = allowedHosts.some((host) =>
                    request.url.startsWith(host)
                  );
                  return isAllowed;
                }
              }}
            />
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={{ color: '#fff', fontFamily: 'LuxoraGrotesk-Book', fontSize: 16 }}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      )}
      {/* Overlay cerrar sesión */}
      {isCargaCerrar && (
      <View style={styles.logoutOverlay}>
          <Text style={styles.logoutText}>Cerrando sesión...</Text>
          <ActivityIndicator size="large" color="#E65800" />
      </View>
      )}
    </View>
  );
}

export default Videos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    width: width * 0.9,
    height: height * 0.55,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    //fontWeight: '700',
    marginBottom: 10,
    color: '#FF6F00',
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Book',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 15,
  },
  webview: {
    flex: 1,
    borderRadius: 12,
  },
  closeBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 25,
  },
  //Estilos para el spinner de cargado de cerrar sesion
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    },
  logoutText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
