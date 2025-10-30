// src/screens/EducacionScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, BackHandler, ActivityIndicator, SafeAreaView, ImageSourcePropType
} from 'react-native';
import { WebView } from 'react-native-webview';
import Header from '../components/Header';

type LoggerKey = 'log' | 'warn' | 'error' | 'onerror' | 'onrejection';

const DFLIP_HTML = 'file:///android_asset/dflip/flip.html';

const COVER_IMG: ImageSourcePropType = require('../assets/dflip/images/book-template.png');

type Book = { title: string; file: string; thumb?: ImageSourcePropType };
const BOOKS: Book[] = [
  { title: 'Potenciales Evocados',   file: 'POTENCIALESEVOCADOSmEDXpro.pdf',       thumb: COVER_IMG },
  { title: 'Conducción Nerviosa',   file: 'ESTUDIOSDECONDUCCIONNERVIOSAmEDXpro.pdf', thumb: COVER_IMG },
];

const LOGGERS: Record<LoggerKey, (...args: any[]) => void> = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  onerror: console.error,
  onrejection: console.error,
};

const EducacionScreen = () => {
  const [activePdf, setActivePdf] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activePdf) { setActivePdf(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [activePdf]);
const flipUri = useMemo(() => {
  // fuerza recarga del HTML cada vez que abres el modal
  return `${DFLIP_HTML}?t=${Date.now()}`;
}, [activePdf]);

  // JS que **manda** el PDF elegido al HTML
  const injectSetPdf = useMemo(() => {
    if (!activePdf) return '';
    // IMPORTANTE: escapamos la URL y devolvemos true
    return `
      (function(){
        try{
          if (window.__setPdf) {
            window.__setPdf(${JSON.stringify(activePdf)});
          } else {
            // si aún no está, guardamos y repetimos en breve
            window.__pdfQueue = ${JSON.stringify(activePdf)};
            setTimeout(function(){
              if(window.__setPdf) window.__setPdf(window.__pdfQueue);
            }, 200);
          }
        }catch(e){}
      })();
      true;
    `;
  }, [activePdf]);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.containerSecundary}>
        <Text style={styles.title}>Educación</Text>

        <View style={styles.grid}>
          {BOOKS.map((b) => (
            <TouchableOpacity
              key={b.title}
              style={styles.card}
              onPress={() => setActivePdf(`file:///android_asset/pdfs/${b.file}`)}
            >
              <Image source={b.thumb || COVER_IMG} style={styles.thumb} resizeMode="cover" />
              <Text style={styles.cardTitle}>{b.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Visor */}
      <Modal visible={!!activePdf} animationType="slide" onRequestClose={() => setActivePdf(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => setActivePdf(null)} style={styles.toolbarBtn}>
              <Text style={styles.toolbarBtnTxt}>← Atrás</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.toolbarTitle}></Text>
            <View style={{ width: 68 }} />
          </View>

          {activePdf ? (
           <WebView
           // 1) Evita fondos transparentes
  style={{ backgroundColor: '#000' }}
  // 2) Si notas parpadeo, prueba estas dos variantes (una u otra):
  androidLayerType="hardware"     // (default) asegura composición por GPU
  // androidLayerType="software"  // alternativa: en algunos devices elimina flicker

  // 3) Evita overscroll glow que a veces provoca repaints
  overScrollMode="never"
  originWhitelist={['*']}
  source={{ uri: flipUri }}
  startInLoadingState
  renderLoading={() => (
    <View style={styles.loader}>
      <ActivityIndicator />
      <Text style={{ color: '#aaa', marginTop: 10 }}>Cargando flipbook…</Text>
    </View>
  )}
  javaScriptEnabled
  domStorageEnabled
  allowFileAccess
  allowFileAccessFromFileURLs
  allowUniversalAccessFromFileURLs
  mixedContentMode="always"
  setSupportMultipleWindows={false}
  onShouldStartLoadWithRequest={() => true}

  /* 1) Antes de que cargue cualquier JS del HTML */
  injectedJavaScriptBeforeContentLoaded={
    activePdf
      ? `
        (function(){
          try{
            // objetivo que TÚ elegiste
            window.__TARGET_PDF = ${JSON.stringify(activePdf)};
            // apaga autoCreate por si el HTML lo tiene en true
            window.DFLIP = window.DFLIP || {};
            window.DFLIP.defaults = window.DFLIP.defaults || {};
            window.DFLIP.defaults.autoCreate = false;
          }catch(e){}
        })();
        true;
      `
      : ''
  }

  /* 2) Después de cargar el HTML */
  injectedJavaScript={
    activePdf
      ? `
        (function(){
          try{
            // 0) Quita cualquier visor auto-creado (_df_book, etc.)
            Array.prototype.slice.call(document.querySelectorAll('._df_book, ._df_thumb, ._df_button')).forEach(function(n){
              if(n && n.parentNode){ n.parentNode.removeChild(n); }
            });

            // 1) Asegura un contenedor donde crear manualmente el flipbook
            var cont = document.getElementById('flipbookPDFContainer');
            if(!cont){
              cont = document.createElement('div');
              cont.id = 'flipbookPDFContainer';
              cont.style.position='absolute';
              cont.style.inset='0';
              document.body.appendChild(cont);
            }else{
              cont.innerHTML = '';
            }

            // 2) Espera a que jQuery y flipBook estén listos y crea el visor del PDF objetivo
            var tries = 0;
            var iv = setInterval(function(){
              try{
                if(window.jQuery && jQuery.fn && jQuery.fn.flipBook){
                  try{
                    // apaga autoCreate por si algún script lo cambia de nuevo
                    window.DFLIP = window.DFLIP || {};
                    window.DFLIP.defaults = window.DFLIP.defaults || {};
                    window.DFLIP.defaults.autoCreate = false;
                  }catch(e){}

                  var pdf = window.__TARGET_PDF || ${JSON.stringify(activePdf)};
                  // crea el flipbook del PDF exacto
                  jQuery("#flipbookPDFContainer").flipBook(pdf, {
                    webgl:false,
                    backgroundColor:'#000000'
                  });

                  clearInterval(iv);
                  return;
                }
              }catch(e){}
              if(++tries > 60){ clearInterval(iv); } // ~6s timeout
            }, 100);
          }catch(e){}
        })();
        true;
      `
      : ''
  }

  onMessage={(e) => {
    try {
      const payload = JSON.parse(e.nativeEvent.data) as { type?: LoggerKey | string; args?: unknown[]; };
      const tag: LoggerKey =
        (payload.type && (payload.type in LOGGERS) ? (payload.type as LoggerKey) : 'log');
      const args = Array.isArray(payload.args) ? payload.args : (payload.args ? [payload.args] : []);
      LOGGERS[tag]('WV:', ...args);
    } catch {
      LOGGERS.log('WV:', e.nativeEvent.data);
    }
  }}
/>

          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
};


export default EducacionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  containerSecundary: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginVertical: 12, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  card: {
    width: 156,
    backgroundColor: '#151515ff',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    elevation: 4,
  },
  thumb: { width: 136, height: 176, borderRadius: 12, backgroundColor: '#222' },
  cardTitle: { color: '#ddd', fontSize: 14, marginTop: 10, textAlign: 'center' },
  toolbar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#121212',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  toolbarBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: '#1f1f1f' },
  toolbarBtnTxt: { color: '#fff', fontWeight: '600' },
  toolbarTitle: { color: '#fff', fontSize: 16, fontWeight: '700', maxWidth: '60%', textAlign: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },


  
});
