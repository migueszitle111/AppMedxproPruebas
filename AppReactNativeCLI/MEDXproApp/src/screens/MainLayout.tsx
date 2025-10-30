import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert, ActivityIndicator, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeScreen2 from './HomeScreen';
import EducacionScreen from './EducacionScreen';
import ReporteScreen from './Menus/MenuReporte';
import EventoScreen from './EventosScreen';
import styles from '../styles/styles1';
import { Screens } from '../constants/screens';
import { useFocusEffect } from '@react-navigation/native';
//import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../constants/config';
import CustomMessage from '../components/CustomMessage';

//const subscriptionIds = ['suscripcion_mensual1', 'suscripcion_anual1'];

function MainLayout(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.Home);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  const [products, setProducts] = useState<RNIap.Subscription[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userSub, setUserSub] = useState<any>(null); // suscripción del usuario
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const isProcessingPurchase = useRef(false);
  const [isCheckingSub, setIsCheckingSub] = useState(true);

  const [messageQueue, setMessageQueue] = useState<{ title: string; message: string }[]>([]);

  // Mostrar el primer mensaje de la cola
  const currentMsg = messageQueue[0];

  /*const [customMsg, setCustomMsg] = useState({
    visible: false,
    title: '',
    message: '',
  });*/

  // 👉 Funciones para abrir/cerrar el mensaje
  const showMessage = (title: string, message: string) => {
    setMessageQueue(prev => [...prev, { title, message }]);
  };
  const hideMessage = () => {
    setMessageQueue(prev => prev.slice(1));
  };

  // 🔑 Cargar token de sesión
  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setUserToken(token);
    };
    loadToken();
  }, []);

  // Ref para tener siempre el último userToken disponible
  const userTokenRef = useRef<string | null>(null);
  useEffect(() => {
    userTokenRef.current = userToken;
  }, [userToken]);

  //const iapEndedRef = useRef(false);
  // 🔑 Inicializar IAP
  /*useEffect(() => {
    const initIAP = async () => {
      try {
        await RNIap.initConnection();
        //Alert.alert('IAP', 'Conexión a la tienda iniciada correctamente.');
        const subs = await RNIap.getSubscriptions({ skus: subscriptionIds });
        setProducts(subs);
        // Mostrar cuántos productos llegaron
        //Alert.alert('Productos', `Se encontraron ${subs.length} suscripciones.`);
      } catch (err) {
        console.warn('Error IAP:', err);
        //Alert.alert('Error de conexión IAP, inténtalo de nuevo', `No se pudo conectar: ${JSON.stringify(err)}`);
      }
    };
    initIAP();

    // 📌 Listener para compras exitosas
    const sub = RNIap.purchaseUpdatedListener(async (purchase: any) => {
      if (isProcessingPurchase.current) {
        console.log('⛔ Listener ya está procesando, ignorando...');
        return;
      }
      isProcessingPurchase.current = true;

      try {
        if (purchase?.transactionReceipt) {
          showMessage(
            'DEBUG ESTADOS',
            `purchaseStateAndroid: ${purchase.purchaseStateAndroid}\n` +
            `isAcknowledgedAndroid: ${purchase.isAcknowledgedAndroid}`
          );
          // ✅ Si la compra está completada en Android
          if (purchase.purchaseStateAndroid === RNIap.PurchaseStateAndroid.PURCHASED) {
            //Alert.alert('¡Compra Exitosa!', 'Validando tu suscripción...');
            //showMessage('¡Compra Exitosa!', 'Validando tu suscripción...');

            if (userTokenRef.current) {
              // 👉 Validar en backend
              await axios.post(`${BASE_URL}/verify-subscription`, {
                token: userTokenRef.current,
                purchaseToken: purchase.purchaseToken,
                productId: purchase.productId,
                packageName: 'com.medxproapp',
              });

              await checkUserSub(userTokenRef.current);
            }

            // 👉 Evitar error E_SERVICE_ERROR
            if (!purchase.isAcknowledgedAndroid) {
              await RNIap.finishTransaction({ purchase, isConsumable: false });
              showMessage('Transacción Finalizada', 'El proceso de compra ha terminado.\nSi no ves los cambios, intenta reiniciar la app.');
              /*showMessage(
                '¡Suscripción activa!',
                'Tu suscripción fue validada.\n\n📩 Recibirás un correo de confirmación.\n🔄 Si no ves los cambios, intenta reiniciar la app.'
              );
            } else {
              showMessage('⚠️ La compra ya esta reconocida', 'no se llama finishTransaction de nuevo.');
            }
          } else if (purchase.purchaseStateAndroid === RNIap.PurchaseStateAndroid.PENDING) {
            //Alert.alert('Compra pendiente', 'Tu pago aún no ha sido confirmado por Google Play.');
            showMessage('Compra pendiente', 'Tu pago aun no ha sido confirmado por Google Play.'); return;
          }
          // Caso desconocido
          else {
            //Alert.alert('Estado desconocido', `purchaseStateAndroid=${purchase.purchaseStateAndroid}`);
            showMessage('Estado desconocido', `purchaseStateAndroid=${purchase.purchaseStateAndroid}`); return;
          }
        }
      } catch (err) {
        //Alert.alert('Error en listener', JSON.stringify(err));
        //showMessage('Error en listener', JSON.stringify(err));
        console.warn('Error en purchaseUpdatedListener:', err);
      } finally {
        isProcessingPurchase.current = false;
      }
    });

    // 📌 Listener para errores
    const err1 = RNIap.purchaseErrorListener((error) => {
      //showMessage('Listener de error', JSON.stringify(error, null, 2));
      if (error.code === 'E_USER_CANCELLED') {
        showMessage('Compra cancelada', 'Has cancelado el proceso de pago.'); return;
      } else if (error.code === 'E_SERVICE_ERROR') {
        showMessage('Pago rechazado', 'Tu metodo de pago fue rechazado.'); return;
      } else {
        showMessage('Error de compra', 'Ya tienes esta suscripción.' ); return;
      }
    });

    return () => {
      sub.remove();
      err1.remove();
      if (!iapEndedRef.current) {
        RNIap.endConnection();
        iapEndedRef.current = true;
        //Alert.alert('IAP', 'Conexión a la tienda finalizada.');
      }
    };
}, []); */// 👈 se monta UNA SOLA VEZ

  // Comprar suscripción
  const buySubscription = async (sub: any) => {
    const offer = sub.subscriptionOfferDetails?.[0];
    if (!offer) {
      showMessage('Error', 'No se encontro una oferta para esta suscripcion.');
      return;
    }

    try {
      await RNIap.requestSubscription({
        sku: sub.productId, // 👈 ojo aquí
        subscriptionOffers: [
          {
            sku: sub.productId, // 👈 obligatorio según Billing v7
            offerToken: offer.offerToken,
          },
        ],
      } as any);

      //showMessage('Solicitud enviada', 'Se abrio la ventana de pago en Google Play.');
    } catch (err: any) {
      console.warn('Error en requestSubscription:', err);
      Alert.alert(
        'Error en Compra',
        JSON.stringify(
          {
            name: err?.name,
            message: err?.message,
            code: err?.code,
            toString: err?.toString(),
          },
          null,
          2
        )
      );
    }
  };

  // Verificar suscripción guardada en backend
  const checkUserSub = useCallback(async (token: string)  => {
    try {
      //showMessage('Verificando Suscripción', 'Buscando tu suscripción en el servidor.');
      setIsCheckingSub(true);

      const res = await axios.post(`${BASE_URL}/user-suscription`, { token });
      const sub = res.data?.data?.subscription;

      if (!sub || sub.paymentState !== 1 || !sub.valid || sub.cancelReason === 3) {
        setUserSub(null);
        //showMessage('Sin Suscripción', 'No se encontró una suscripción activa.');
        return;
      }

      // 🔹 Conversión segura de fechas
      const start = sub.startDate ? new Date(sub.startDate).toLocaleString() : 'N/A';
      const expiry = sub.expiryDate ? new Date(sub.expiryDate).toLocaleString() : 'N/A';
      const auto = sub.autoRenewing ? 'Sí' : 'No';
      const valid = sub.valid ? '✅ Válida' : '❌ Expirada';
      const cancel = sub.cancelReason ?? 'N/A';
      const prodId = sub.productId ?? 'N/A';
      const payment = sub.paymentState === 1 ? '✅ Pagada' : '❌ No pagada';

      // Debug info para el desarrollador
      showMessage(
        'Suscripción Debug',
        `📦 Producto: ${prodId}\n📅 Inicio: ${start}\n⏳ Expira: ${expiry}\n🔁 Auto-renovación: ${auto}\n🚫 CancelReason: ${cancel}\n🔐 Estado: ${valid}\n Pago: ${payment}`
      );
      //Detectar cancelación
      if (sub.autoRenewing === false){
        const key = `cancelMsgShown_${sub.productId}`;
        const alreadyShown = await AsyncStorage.getItem(key);
        if (!alreadyShown) {
          let reasonMsg = '';
          switch(sub.cancelReason) {
            case 0:
              reasonMsg = 'Has cancelado la suscripción manualmente.';
              break;
            case 1:
              reasonMsg = 'El pago de tu suscripción falló.';
              break;
            case 2:
              reasonMsg = 'La suscripción fue reemplazada por otra.';
              break;
            case 3:
              reasonMsg = 'La suscripción fue revocada por Google Play.';
              break;
            default:
              reasonMsg = 'Tu suscripción fue cancelada.';
          }
          showMessage(
            'Suscripción Cancelada',
            `${reasonMsg} Expira el ${new Date(sub.expiryDate).toLocaleDateString()}.`
          );
          await AsyncStorage.setItem(key, 'true');
        }
      }

      if (sub.valid) {
        setUserSub(sub);
        showMessage('Suscripción Encontrada', 'Tienes una suscripción activa.');
        return;
      }
    } catch (err) {
      setUserSub(null);
      showMessage('Error de Verificación', `Ocurrio un error al verificar la suscripción: ${JSON.stringify(err)}`);
      console.warn('Error al verificar suscripción:', err);
    } finally {
      setIsCheckingSub(false);
    }
  }, []);

  // Al iniciar, verificar suscripción del usuario
  useEffect(() => {
    if (userToken) {
      checkUserSub(userToken);
    }
  }, [checkUserSub, userToken]);

  useEffect(() => {
    console.log('Pantalla actual:', currentScreen);
  }, [currentScreen]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Salir de la App', '¿Estás seguro que quieres salir?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8, // más rebote visual
    }).start();
  }, []);

  // Queremos que el mensual (suscripcion_mensual) vaya primero
  const orderedProducts = [...products].sort((a, b) => {
    if (a.productId === 'suscripcion_mensual1') return -1;
    if (b.productId === 'suscripcion_mensual1') return 1;
    return 0;
  });

  // 🔑 Mostrar pantalla principal solo si tiene suscripción válida
  // Render pantalla
  const renderContent = () => {
    switch (currentScreen) {
      case Screens.Educacion:
        return <EducacionScreen />;
      case Screens.Reporte:
        return <ReporteScreen />;
      case Screens.Eventos:
        return <EventoScreen />;
      default:
        return <HomeScreen2 />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <Footer setCurrentScreen={setCurrentScreen} />
      {/* 🔒 Overlay de suscripciones */}
      {/*!isCheckingSub && (!userSub || !userSub.valid) && (
        <View style={localStyles.overlayContainer} pointerEvents="auto">
          <Animated.View
            style={[
              localStyles.subContainer,
              { transform: [{ scale: scaleAnim }] }, // 👈 Animación de escala
            ]}
          >
            <Text style={localStyles.subTitle}>Elige tu plan para continuar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.subOptions}>
              {orderedProducts.map((p: any) => {
                const offer = p.subscriptionOfferDetails?.[0];
                const price = offer?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice || '';
                const isAnnual = p.productId === 'suscripcion_anual1';
                const isSelected = selectedProductId === p.productId;

                return (
                  <TouchableOpacity
                    key={p.productId}
                    activeOpacity={0.9}
                    onPress={() => setSelectedProductId(selectedProductId === p.productId ? null : p.productId)}
                    style={[
                      localStyles.subCard,
                      isAnnual && { borderColor: '#F54627' },
                      isSelected && {  transform: [{ scale: 1.03 }], shadowColor: '#F52727', shadowOpacity: 0.8, elevation: 10, marginVertical: 15,},
                    ]}
                  >
                          {/* Badge para el plan anual
                    {isAnnual && (
                      <View style={localStyles.badge}>
                        <Text style={localStyles.badgeText}>¡Ahorra!</Text>
                      </View>
                    )}

                    {/* Título y precio corto
                    <Text style={localStyles.subName}>{p.title}</Text>
                    <Text style={localStyles.subPrice}>
                      {isAnnual ? '$350.00 USD / (x12 meses)' : '$35.00 USD / mes'}
                    </Text>
                    {/* Descripción corta
                    <Text style={localStyles.subDesc}>
                      {isAnnual ? p.description || 'Acceso completo por 12 meses' : p.description || 'Acceso completo por un mes'}
                    </Text>
                    {/* Contenido expandido
                    {isSelected && (
                      <>
                        <View style={{ height: 10 }} />
                        {isAnnual ? (
                          <>
                            {/*<Text style={localStyles.annualTotal}>Pago único: {price} MXN</Text>
                            <Text style={localStyles.annualSave}>Ahorra $70.00 USD al año</Text>
                            <Text style={localStyles.smallNote}>Pago único, no reembolsable.</Text>
                            <Text style={localStyles.smallNote}>Se renovará automáticamente cada año.</Text>
                            <Text style={localStyles.smallNote}>El precio final puede incluir impuestos locales y
                              se mostrará en tu moneda local al momento de la compra.</Text>
                          </>
                        ) : (
                          <>
                            <Text style={localStyles.smallNote}>Pago único, no reembolsable.</Text>
                            <Text style={localStyles.smallNote}>Se renovará automáticamente cada mes.</Text>
                            <Text style={localStyles.smallNote}>El precio final puede incluir impuestos locales y
                              se mostrará en tu moneda local al momento de la compra.</Text>
                          </>
                        )}

                        {/* Botón de suscripción 
                        <TouchableOpacity
                          style={localStyles.buyButton}
                          onPress={() => buySubscription(p)}
                        >
                          <Text style={localStyles.buyButtonText}>Obtener</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}

            </ScrollView>
            {/*<TouchableOpacity
              //onPress={() => {
                //setOverlayDismissed(true); // ya no tocamos userSub
                //Alert.alert('Suscripción Omitida', 'Puedes explorar en modo limitado.');
              //}}
            >
              <Text style={localStyles.skipText}> </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )*/}
      <CustomMessage
        visible={!!currentMsg}
        title={currentMsg?.title || ''}
        message={currentMsg?.message || ''}
        onClose={hideMessage}
      />

      {isCargaCerrar && (
        <View style={localStyles.logoutOverlay}>
          <Text style={localStyles.logoutText}>Cerrando sesión...</Text>
          <ActivityIndicator size="large" color="#E65800" />
        </View>
      )}
      {isCheckingSub && (
        <View style={localStyles.logoutOverlay}>
          <ActivityIndicator size="large" color="#E65800" />
        </View>
      )}
    </View>
  );
}

export default MainLayout;

const localStyles = StyleSheet.create({
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoutText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)', // oscurece el fondo
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // asegurarte de que esté encima
  },
  overlayContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    width: '80%',
  },
  overlayText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  overlayButton: {
    backgroundColor: '#C44900',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  testCloseButton: {
    padding: 8,
    marginTop: 10,
  },
  testCloseText: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },
  blockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedText: {
    fontSize: 18,
    color: '#C44900',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  subContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 24,
    width: '92%',
    maxHeight: '80%',
    shadowColor: '#E65800',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 26,
    fontFamily: 'LuxoraGrotesk-Bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    borderRadius: 8,
    borderColor: '#FFA647',
    borderBottomWidth: 1,
    marginVertical: 5,
    paddingVertical: 5,
    letterSpacing: 0.5,
  },
  subOptions: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  subCard: {
    backgroundColor: '#1f1f1f',
    padding: 22,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    width: 240,
    shadowColor: '#E65800',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: '#E65800', // por defecto
  },
  subName: {
    fontSize: 20,
    fontFamily: 'LuxoraGrotesk-Bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  subPrice: {
    fontSize: 18,
    color: '#FFA647',
    fontFamily: 'LuxoraGrotesk-Light',
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#FFA647',
    borderBottomWidth: 1,
    textAlign: 'center',
  },
  subDesc: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'LuxoraGrotesk-Light',
    textAlign: 'center',
  },
  skipText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'LuxoraGrotesk-Regular',
    textDecorationLine: 'underline',
  },
  // Diseño para las suscripciones
  buyButton: {
    backgroundColor: '#E65800',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#FFA647',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LuxoraGrotesk-Regular',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    marginTop: -12,
    right: -12,
    backgroundColor: '#D9381C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 2,
    elevation: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'LuxoraGrotesk-Bold',
  },
  annualTotal: {
    fontSize: 15,
    color: '#FFA647',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  annualSave: {
    fontSize: 14,
    color: '#28a745',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  smallNote: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
