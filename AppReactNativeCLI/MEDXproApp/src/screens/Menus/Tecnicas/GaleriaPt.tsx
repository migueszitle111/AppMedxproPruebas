import React, { useRef, useState, useEffect } from 'react';
import { View, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet, Text, ViewToken, TouchableWithoutFeedback, LayoutChangeEvent, useWindowDimensions, Vibration  } from 'react-native';
import Orientation from 'react-native-orientation-locker';

import I_Expand from '../../../assets/03_Íconos/03_02_PNG/I_Expand.png'
import cerrado from '../../../assets/03_Íconos/03_02_PNG/I_Crop.png'

import ImageViewer from 'react-native-image-zoom-viewer';

// Types
type InfoButtonDataP = {
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
    infoImage?: any[] | any;
};

type ImageButtonDataP = {
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
    popupText?: string;
    popupTextX?: number;
    popupTextY?: number;
    popupTextWidth?: number;
    popupTextHeight?: number;
};

type ImgButton = {
    type: 'ImgBtn';
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
    infoImage: any[];
    buttonImageSource: any;
};

type TxtButtonImg = {
    type: 'TxtButtonImg';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text: string;
    infoText: string;
    infoImage: any[];
    infoBoxX?: number;
    infoBoxY?: number;
    infoBoxWidth?: number;
    infoBoxHeight?: number;
    rotateDeg?: number;
    buttonImageSource: any;
};

type ButtonData = InfoButtonDataP | ImageButtonDataP | ImgButton | TxtButtonImg;

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

const getInfoBoxFontSize = (text: string) => {
    const textLength = text.length;
    if (textLength > 300) {
        return 10;
    }
    if (textLength > 150) {
        return 11;
    }
    return 12;
};

const getPopupFontSize = (text: string) => {
    const textLength = text.length;
    if (textLength > 250) {
        return 10;
    }
    if (textLength > 120) {
        return 11;
    }
    return 12;
};

const GaleriaP = ({ data, opcionSeleccionada, toggleMenu, menuVisible }: GaleriaProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const flatListRef = useRef<FlatList<GalleryItem>>(null);

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
    const [infoImageVisible, setInfoImageVisible] = useState(false);
    const [infoImageSource, setInfoImageSource] = useState<any[]>([]);
    const [popupTextVisible, setPopupTextVisible] = useState(false);
    const [popupTextContent, setPopupTextContent] = useState('');
    const [popupTextDynamicStyle, setPopupTextDynamicStyle] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [activeContent, setActiveContent] = useState<string | null>(null);

    useEffect(() => {
        Orientation.lockToLandscape();
        return () => Orientation.unlockAllOrientations();
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            const { width, height } = Dimensions.get('window');
            const isPortrait = height >= width;

            setGalleryDimensions({
                width: width * 0.92,
                height: isPortrait ? height * 0.7 : height * 0.90
            });

            if (!isInitialized) setIsInitialized(true);
        };

        updateDimensions();
        const subscription = Dimensions.addEventListener('change', updateDimensions);
        return () => subscription.remove();
    }, [screenWidth, screenHeight, isInitialized]);

    useEffect(() => {
        if (isInitialized && flatListRef.current && data.imagenes.length > 0) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
            setIndexActual(0);
        }
    }, [opcionSeleccionada, data, isInitialized]);

    // Nuevo useEffect para limpiar los popups al cambiar la categoría
    useEffect(() => {
        hideAllPopups();
    }, [opcionSeleccionada]);

    const galleryItems: GalleryItem[] = data.imagenes.map((img, idx) => ({
        image: img,
        buttons: data.botones[idx] || [],
    }));

    const viewabilityConfig = { viewAreaCoveragePercentThreshold: 80 };
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
            if (viewableItems.length > 0) {
                setIndexActual(viewableItems[0].index ?? 0);
                setInfoBoxVisible(false);
                setPopupImageVisible(false);
                setInfoImageVisible(false);
                setPopupTextVisible(false);
            }
        }
    ).current;

    const irAImagen = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setInfoBoxVisible(false);
        setPopupImageVisible(false);
        setInfoImageVisible(false);
        setPopupTextVisible(false);
    };

    const onScrollToIndexFailed = (info: any) => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
        }, 500);
    };

    const calculateRealPosition = (button: ButtonData) => {
        const realX = (button.x / 100) * galleryDimensions.width;
        const realY = (button.y / 100) * galleryDimensions.height;
        const realWidth = button.width ? (button.width / 100) * galleryDimensions.width : undefined;
        const realHeight = button.height ? (button.height / 100) * galleryDimensions.height : undefined;

        return {
            x: realX,
            y: realY,
            width: realWidth,
            height: realHeight,
        };
    };
    
    // Función para manejar el clic en el botón
const handleButtonPress = (button: ButtonData, btnIdx: number) => {
        // Genera un identificador único para el contenido de este botón
        const currentContentId = `${button.type}_${btnIdx}`;
        if (activeContent === currentContentId) {
            hideAllPopups();
            setActiveContent(null);
            return;
        }

        // Si el contenido ya está visible, ocúltalo
        if (activeContent === currentContentId) {
            hideAllPopups();
            setActiveContent(null);
            return;
        }

        // Oculta el contenido anterior y muestra el nuevo
        hideAllPopups();
        setActiveContent(currentContentId);

        if (button.type === 'info') {
            // Agrega la vibración aquí para que solo se ejecute para los botones 'info'
            Vibration.vibrate();

            const infoButton = button as InfoButtonDataP;
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

            if (infoButton.infoImage) {
                const images = Array.isArray(infoButton.infoImage) ? infoButton.infoImage : [infoButton.infoImage];
                setInfoImageSource(images);
                setInfoImageVisible(true);
            }

        } else if (button.type === 'image') {
            const imageButton = button as ImageButtonDataP;
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

            if (imageButton.popupText) {
                setPopupTextContent(imageButton.popupText);
                setPopupTextVisible(true);

                const textX = imageButton.popupTextX !== undefined ? `${imageButton.popupTextX}%` : '5%';
                const textY = imageButton.popupTextY !== undefined ? `${imageButton.popupTextY}%` : 'auto';
                const textWidth = imageButton.popupTextWidth !== undefined ? `${imageButton.popupTextWidth}%` : '90%';
                const textHeight = imageButton.popupTextHeight !== undefined ? `${imageButton.popupTextHeight}%` : 'auto';

                setPopupTextDynamicStyle({
                    left: textX,
                    top: textY === 'auto' ? undefined : textY,
                    width: textWidth,
                    height: textHeight === 'auto' ? undefined : textHeight,
                    bottom: textY === 'auto' ? 20 : undefined
                });
            }
        } else if (button.type === 'ImgBtn') {
            const imgButton = button as ImgButton;
            if (Array.isArray(imgButton.infoImage)) {
                setInfoImageSource(imgButton.infoImage);
                setInfoImageVisible(true);
            }
        } else if (button.type === 'TxtButtonImg') {
            const txtButtonImg = button as TxtButtonImg;
            setInfoBoxContent(txtButtonImg.infoText);

            const finalX = txtButtonImg.infoBoxX !== undefined ? (txtButtonImg.infoBoxX / 100) * screenWidth : ((txtButtonImg.x / 100) * galleryDimensions.width) + 20;
            const finalY = txtButtonImg.infoBoxY !== undefined ? (txtButtonImg.infoBoxY / 100) * screenHeight : ((txtButtonImg.y / 100) * galleryDimensions.height) - 50;
            const finalWidth = txtButtonImg.infoBoxWidth !== undefined ? (txtButtonImg.infoBoxWidth / 100) * screenWidth : 250;
            const finalHeight = txtButtonImg.infoBoxHeight !== undefined ? (txtButtonImg.infoBoxHeight / 100) * screenHeight : 120;

            setInfoBoxDynamicStyle({
                left: Math.max(0, Math.min(finalX, screenWidth - finalWidth - 10)),
                top: Math.max(0, Math.min(finalY, screenHeight - finalHeight - 10)),
                width: finalWidth,
                height: finalHeight,
            });
            setInfoBoxVisible(true);
            
            if (Array.isArray(txtButtonImg.infoImage)) {
                setInfoImageSource(txtButtonImg.infoImage);
                setInfoImageVisible(true);
            }
        }
    };
    
    const hideAllPopups = () => {
        setInfoBoxVisible(false);
        setPopupImageVisible(false);
        setInfoImageVisible(false);
        setPopupTextVisible(false);
        setActiveContent(null);
    };

    const mostrarFlechas = galleryItems.length > 1;

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
        infoImageOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 2,
        },
        popupTextBox: {
            position: 'absolute',
            backgroundColor: 'rgba(82, 82, 82, 0.6)',
            borderRadius: 10,
            borderWidth: 1,
            padding: 5,
            zIndex: 5,
            textAlign: 'justify'
        },
        popupTextBoxText: {
            color: 'white',
            fontSize: 12,
            textAlign: 'justify',
            padding: 5,
        },
    });

    const combinedStyles = {
        ...styles,
        ...dynamicStyles
    };

    return (
        <View style={combinedStyles.container}>

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
                                    const realPos = calculateRealPosition(button);
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
                                                (button.type === 'image' || button.type === 'ImgBtn' || button.type === 'TxtButtonImg') && { backgroundColor: 'transparent', borderWidth: 0 },
                                            ]}
                                            onPress={() => handleButtonPress(button, btnIdx)}
                                        >
                                            {(button.type === 'image' && (button as ImageButtonDataP).buttonImageSource) || (button.type === 'ImgBtn' && (button as ImgButton).buttonImageSource) || (button.type === 'TxtButtonImg' && (button as TxtButtonImg).buttonImageSource) ? (
                                                <Image
                                                    source={(button.type === 'image' ? (button as ImageButtonDataP).buttonImageSource : (button.type === 'ImgBtn' ? (button as ImgButton).buttonImageSource : (button as TxtButtonImg).buttonImageSource))}
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

            {/* Contenedores de Popups con pointerEvents ajustados */}
            {infoImageVisible && infoImageSource.length > 0 && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }]}>
                    {infoImageSource.map((img, index) => (
                        <Image
                            key={index}
                            source={img}
                            style={combinedStyles.infoImageOverlay}
                            resizeMode="contain"
                        />
                    ))}
                </View>
            )}

            {infoBoxVisible && (
                <View style={[combinedStyles.infoBox, infoBoxDynamicStyle, { zIndex: 2, pointerEvents: 'none' }]}>
                    <Text style={[combinedStyles.infoBoxText, { fontSize: getInfoBoxFontSize(infoBoxContent) }]}>
                        {infoBoxContent}
                    </Text>
                </View>
            )}

            {popupImageVisible && popupImageSource && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 5, backgroundColor: 'rgba(0, 0, 0, 0.58)', justifyContent: 'center', alignItems: 'center' }]}>
                
                
                <ImageViewer
                    renderIndicator={() => <View />}
                    imageUrls={[{ url: Image.resolveAssetSource(popupImageSource).uri }]}
                    enableSwipeDown={true}
                    onSwipeDown={hideAllPopups}

                    renderImage={(props) => {
                        return (
                            <Image
                            {...props}
                            // Puedes ajustar el tamaño inicial aquí usando un estilo de transformación
                            style={[props.style, { transform: [{ scale: 0.8 }] }]}
                            />
                        );
                        }}
                    renderHeader={() => (
                        <TouchableOpacity
                            onPress={hideAllPopups}
                            style={[combinedStyles.closeButtonImage]}
                        >
                            <Text style={combinedStyles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}
                    style={{ width: '100%', height: '100%' }}
                />
                {popupTextVisible && (
                    <View style={[combinedStyles.popupTextBox, popupTextDynamicStyle]}>
                        <Text style={[combinedStyles.popupTextBoxText, { fontSize: getPopupFontSize(popupTextContent) }]}>
                            {popupTextContent}
                        </Text>
                    </View>
                )}
            </View>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    menuButton: {
        position: 'absolute',
        top: -10,
        left: 5,
        backgroundColor: '#ffffffff',
        borderRadius: 25,
        width: 70,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    menuText: {
        color: 'rgba(0, 0, 0, 0.5)',
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
        backgroundColor: 'rgba(34, 34, 34, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        borderRadius: 10,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBoxText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'justify',
    },
    popupImageContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        padding: 0,
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

export default GaleriaP;