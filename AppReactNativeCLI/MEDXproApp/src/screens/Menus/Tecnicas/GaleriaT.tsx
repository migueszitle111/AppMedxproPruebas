import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  StyleSheet, 
  Text, 
  ViewToken, 
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  useWindowDimensions, 
  Vibration
} from 'react-native';

import I_Expand from '../../../assets/03_Íconos/03_02_PNG/I_Expand.png'
import cerrado from '../../../assets/03_Íconos/03_02_PNG/I_Crop.png'
import ImageViewer from 'react-native-image-zoom-viewer';
// Types
type InfoButtonData = {
  type: 'info';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  infoText: string;
  infoBoxX?: number;
  infoBoxY?: number;
  infoBoxWidth?: number;
  infoBoxHeight?: number;
  rotateDeg?: number;
  infoImage?: any;
};

type ImageButtonData = {
  type: 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  imageSource: any;
  popupImageX?: number;
  popupImageY?: number;
  popupImageWidth?: number;
  popupImageHeight?: number;
  buttonImageSource?: any;
  rotateDeg?: number;
};

type ButtonData = InfoButtonData | ImageButtonData;

type GalleryItem = {
  image: any;
  buttons: ButtonData[];
};

type GaleriaProps = {
  data: {
    imagenes: any[];
    botones: ButtonData[][];
  };
  opcionSeleccionada: string | null;
  toggleMenu: () => void;
  menuVisible: boolean;
};

const GaleriaT = ({ data, opcionSeleccionada, toggleMenu, menuVisible }: GaleriaProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const flatListRef = useRef<FlatList<GalleryItem>>(null);
  
  // State for gallery dimensions
  const [galleryDimensions, setGalleryDimensions] = useState({
    width: screenWidth * 0.92,
    height: screenHeight * 0.6
  });
  
  const [indexActual, setIndexActual] = useState(0);
  const [infoBoxVisible, setInfoBoxVisible] = useState(false);
  const [infoBoxContent, setInfoBoxContent] = useState('');
  const [infoBoxDynamicStyle, setInfoBoxDynamicStyle] = useState({});
  const [popupImageVisible, setPopupImageVisible] = useState(false);
  const [popupImageSource, setPopupImageSource] = useState<any>(null);
  const [popupImageStyle, setPopupImageStyle] = useState({});
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  

  // Handle orientation changes
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      const isPortrait = height >= width;
      
      setGalleryDimensions({
        width: width * 0.92,
        height: isPortrait ? height * 0.7 : height * 0.95
      });
      
      if (!isInitialized) setIsInitialized(true);
    };

    updateDimensions();
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    
    return () => subscription.remove();
  }, [screenWidth, screenHeight, isInitialized]);

  // Reset when option changes
  useEffect(() => {
    if (isInitialized && flatListRef.current && data.imagenes.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
      setIndexActual(0);
    }
  }, [opcionSeleccionada, data, isInitialized]);

  // Prepare gallery items
  const galleryItems: GalleryItem[] = data.imagenes.map((img, idx) => ({
    image: img,
    buttons: data.botones[idx] || [],
  }));

  // Viewability config
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 80 };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems.length > 0) {
        setIndexActual(viewableItems[0].index ?? 0);
        setInfoBoxVisible(false);
        setPopupImageVisible(false);
      }
    }
  ).current;

  // Navigation
  const irAImagen = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setInfoBoxVisible(false);
    setPopupImageVisible(false);
  };

  // Handle scroll failures
  const onScrollToIndexFailed = (info: any) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    }, 500);
  };

  // Get actual image dimensions
  const handleImageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setImageDimensions({ width, height });
  };

  // Calculate button positions
    const calculateRealPosition = (
      button: ButtonData,
      originalImageDimensions: { width: number; height: number },
      galleryDimensions: { width: number; height: number }
    ) => {
      // 1. Encuentra el factor de escala de la imagen renderizada
      const scale = Math.min(
        galleryDimensions.width / originalImageDimensions.width,
        galleryDimensions.height / originalImageDimensions.height
      );

      // 2. Calcula las dimensiones de la imagen visualmente renderizada
      const renderedWidth = originalImageDimensions.width * scale;
      const renderedHeight = originalImageDimensions.height * scale;

      // 3. Calcula el offset (espacio vacío)
      const offsetX = (galleryDimensions.width - renderedWidth) / 2;
      const offsetY = (galleryDimensions.height - renderedHeight) / 2;

      // 4. Calcula la posición y tamaño reales del botón
      const realX = (button.x / 100) * renderedWidth + offsetX;
      const realY = (button.y / 100) * renderedHeight + offsetY;
      const realWidth = button.width ? (button.width / 100) * renderedWidth : undefined;
      const realHeight = button.height ? (button.height / 100) * renderedHeight : undefined;

      

      return {
        x: realX,
        y: realY,
        width: realWidth,
        height: realHeight,
      };
    };

  // Handle button press
const handleButtonPress = (button: ButtonData) => {
    setInfoBoxVisible(false);
    setPopupImageVisible(false);

    if (button.type === 'info') {
        // La vibración ahora solo se ejecuta para los botones 'info'
        Vibration.vibrate();

        const infoButton = button as InfoButtonData;
        setInfoBoxContent(infoButton.infoText);

        const finalX = infoButton.infoBoxX !== undefined ? (infoButton.infoBoxX / 100) * screenWidth : ((infoButton.x / 100) * galleryDimensions.width) + 20;
        const finalY = infoButton.infoBoxY !== undefined ? (infoButton.infoBoxY / 100) * screenHeight : ((infoButton.y / 100) * galleryDimensions.height) - 50;
        const finalWidth = infoButton.infoBoxWidth !== undefined ? (infoButton.infoBoxWidth / 100) * screenWidth : 250;
        const finalHeight = infoButton.infoBoxHeight !== undefined ? (infoButton.infoBoxHeight / 100) * screenHeight : 120;


        setInfoBoxDynamicStyle({
            left: Math.max(0, Math.min(finalX, screenWidth - finalWidth - 10)),
            top: Math.max(0, Math.min(finalY, screenHeight - finalHeight - 10)),
            width: finalWidth,
            height: finalHeight,
        });
        setInfoBoxVisible(true);

    } else if (button.type === 'image') {
        const imageButton = button as ImageButtonData;
        setPopupImageSource(imageButton.imageSource);

        const finalX = imageButton.popupImageX !== undefined ? (imageButton.popupImageX / 100) * screenWidth : (screenWidth - (screenWidth * 0.7)) / 2;
        const finalY = imageButton.popupImageY !== undefined ? (imageButton.popupImageY / 100) * screenHeight : (screenHeight - (screenHeight * 0.6)) / 2;
        const finalWidth = imageButton.popupImageWidth !== undefined ? (imageButton.popupImageWidth / 100) * screenWidth : screenWidth * 0.7;
        const finalHeight = imageButton.popupImageHeight !== undefined ? (imageButton.popupImageHeight / 100) * screenHeight : screenHeight * 0.6;

        setPopupImageStyle({
            left: Math.max(0, Math.min(finalX, screenWidth - finalWidth)),
            top: Math.max(0, Math.min(finalY, screenHeight - finalHeight)),
            width: finalWidth,
            height: finalHeight,
        });
        setPopupImageVisible(true);
    }
};

  // Hide all popups
  const hideAllPopups = () => {
    setInfoBoxVisible(false);
    setPopupImageVisible(false);
  };

  const mostrarFlechas = galleryItems.length > 1;

  // Dynamic styles
  const dynamicStyles = StyleSheet.create({
    container: {
      height: galleryDimensions.height + 20,
      width: '100%',
    },
    imagenPrincipal: {
      width: galleryDimensions.width,
      height: galleryDimensions.height,
    },
    itemContainer: {
      height: galleryDimensions.height,
    },
  });

  // Combine static and dynamic styles
  const combinedStyles = {
    ...styles,
    ...dynamicStyles
  };

  return (
    <TouchableWithoutFeedback onPress={hideAllPopups}>
      <View style={combinedStyles.container}>

        
        {/* Flechas colocadas fuera del FlatList pero dentro del contenedor principal */}
        {mostrarFlechas && indexActual > 0 && (
          <TouchableOpacity 
            style={[combinedStyles.flechaIzq, { top: galleryDimensions.height / 2 - 70 }]} 
            onPress={() => irAImagen(indexActual - 1)}
          >
            <Text style={combinedStyles.flechaTexto}>{'⟨'}</Text>
          </TouchableOpacity>
        )}

        {isInitialized && (
          <FlatList
            ref={flatListRef}
            data={galleryItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
            renderItem={({ item }) => {
              // Obtiene las dimensiones originales de la imagen aquí
              const imageSource = Image.resolveAssetSource(item.image);
              const originalImageDimensions = {
                width: imageSource.width,
                height: imageSource.height,
              };

              return (
                <View
                  style={[
                    combinedStyles.itemContainer,
                    {
                      width: screenWidth,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                      <Image
                          source={menuVisible ? I_Expand : cerrado}
                          style={styles.menuButtonImage}
                          resizeMode="contain"
                      />
                  </TouchableOpacity>
                  <Image
                  
                    source={item.image}
                    style={combinedStyles.imagenPrincipal}
                    resizeMode="contain"
                  />
                  
                  {item.buttons.map((button, btnIdx) => {
                    // Pasa las dimensiones originales de la imagen y las de la galería
                    const realPos = calculateRealPosition(
                      button,
                      originalImageDimensions,
                      galleryDimensions
                    );
                    return (
                      <TouchableOpacity
                        key={btnIdx}
                        style={[
                          combinedStyles.overlayButton,
                          {
                            left: realPos.x,
                            top: realPos.y,
                            width: realPos.width,
                            height: realPos.height,
                          },
                          button.rotateDeg !== undefined
                            ? { transform: [{ rotate: `${button.rotateDeg}deg` }] }
                            : undefined,
                          button.type === 'image' && { backgroundColor: 'transparent', borderWidth: 0 },
                        ]}
                        onPress={() => handleButtonPress(button)}
                      >
                        {button.type === 'image' && (button as ImageButtonData).buttonImageSource ? (
                          <Image
                            source={(button as ImageButtonData).buttonImageSource}
                            style={combinedStyles.buttonBackgroundImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={combinedStyles.overlayButtonText}>{button.text}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }}

            keyExtractor={(_, i) => i.toString()}
            scrollEnabled={galleryItems.length > 1}
            onScrollToIndexFailed={onScrollToIndexFailed}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index
            })}
            extraData={screenWidth}
            snapToInterval={screenWidth}
            decelerationRate="fast"
          />
        )}

        {mostrarFlechas && indexActual < galleryItems.length - 1 && (
          <TouchableOpacity 
            style={[combinedStyles.flechaDer, { top: galleryDimensions.height / 2 - 70 }]} 
            onPress={() => irAImagen(indexActual + 1)}
          >
            <Text style={combinedStyles.flechaTexto}>{'⟩'}</Text>
          </TouchableOpacity>
        )}

        {infoBoxVisible && (
          <View style={[combinedStyles.infoBox, infoBoxDynamicStyle]}>
            <Text style={combinedStyles.infoBoxText}>{infoBoxContent}</Text>
          </View>
        )}


        {popupImageVisible && popupImageSource && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 10, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }]}>
            <ImageViewer
              imageUrls={[{ url: Image.resolveAssetSource(popupImageSource).uri }]}
              renderIndicator={() => <View />}
              // Esta es la solución alternativa
              renderImage={(props) => {
                return (
                  <Image
                    {...props}
                    // Puedes ajustar el tamaño inicial aquí usando un estilo de transformación
                    style={[props.style, { transform: [{ scale: 0.7 }] }]}
                  />
                );
              }}

              
              enableSwipeDown={true}
              onSwipeDown={hideAllPopups}
              renderHeader={() => (
                <TouchableOpacity
                  onPress={hideAllPopups}
                  style={[combinedStyles.closeButtonImage, { zIndex: 10 }]}
                >
                  <Text style={combinedStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

// Base styles
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#ffffffff',
    borderRadius: 25,
    width: 70,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuText: {
    color: 'rgba(0, 0, 0, 0.5)',//rgba(0, 0, 0, 0.5)
    fontSize: 25,
  },
  imagenWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imagenPrincipal: {
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  itemContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flechaIzq: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 30,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flechaDer: {
    position: 'absolute',
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 30,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flechaTexto: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlayButton: {
    position: 'absolute',
    backgroundColor: 'transparent',//rgba(255, 165, 0, 0.7)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overlayButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoBox: {
    position: 'absolute',
    backgroundColor: 'rgba(34, 34, 34, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    padding: 5,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBoxText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'left',
  },
  popupImageContainer: {
    position: 'absolute',
    zIndex: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  closeButtonImage: {
    position: 'absolute',
    top: 10,
    right: 30,
    backgroundColor: '#1C1C1C',
    borderRadius: 100,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'orange',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
  },
  menuButtonImage: {
    width: 40,
    height: 40,
  },
});

export default GaleriaT;