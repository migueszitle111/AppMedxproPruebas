import React, { useRef, useState, useEffect } from 'react';
import { View, Image, FlatList, TouchableOpacity, StyleSheet, Text, ViewToken, TouchableWithoutFeedback, LayoutChangeEvent, useWindowDimensions, Vibration, PanResponder } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { Dimensions, PixelRatio } from 'react-native';

import I_Expand from '../../../assets/03_Íconos/03_02_PNG/I_Expand.png';
import cerrado from '../../../assets/03_Íconos/03_02_PNG/I_Crop.png';

import ImageViewer from 'react-native-image-zoom-viewer';


// =================================================================
// 1. TIPOS DE DATOS (Mismos que el original)
// =================================================================
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
    
    // 📢 NUEVOS PARÁMETROS AGREGADOS AQUÍ:
    magnifierSize?: number; 
    zoomFactor?: number;
    divX?: number;
    divY?: number;
};

type StaticTextData = {
    type: 'staticText';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text: string;
    rotateDeg?: number;
    infoImage?: any[];
    fontSize?: number;
    fontFamily?: string;
    textHighlights?: { text: string; }[];
};

type ButtonData = InfoButtonDataP | ImageButtonDataP | ImgButton | TxtButtonImg | StaticTextData;

type GalleryItem = {
    image: any[][];
    buttons: ButtonData[];
};

type GaleriaProps = {
    data: {
        imagenes: any[][];
        botones: ButtonData[][];
    };
    opcionSeleccionada: string | null;
    toggleMenu: () => void;
    menuVisible: boolean;
};
// =================================================================
// 2. FUNCIONES AUXILIARES (Mismas que el original)
// =================================================================

const getInfoBoxFontSize = (text: string) => {
    const textLength = text.length;
    if (textLength > 300) {
        return 12;
    }
    if (textLength > 150) {
        return 11;
    }
    return 14;
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

// Función para renderizar el texto con partes en negrita (para staticText)
const renderStyledText = (text: string, highlights: { text: string }[] | undefined, fontSize: number | undefined, fontFamily: string | undefined, combinedStyles: any) => {
    if (!highlights || highlights.length === 0) {
        return (
            <Text style={{
                ...combinedStyles.staticText,
                fontSize: fontSize || 10,
                fontFamily: fontFamily || undefined
            }}>
                {text}
            </Text>
        );
    }

    let currentText = text;
    const parts: { text: string, bold: boolean }[] = [];

    highlights.forEach(highlight => {
        const regex = new RegExp(`(${highlight.text})`, 'g');
        const segments = currentText.split(regex).filter(Boolean); // Dividir y eliminar cadenas vacías

        segments.forEach((segment) => {
            if (segment === highlight.text) {
                parts.push({ text: segment, bold: true });
            } else {
                parts.push({ text: segment, bold: false });
            }
        });
        currentText = ''; // Ya se procesó todo el texto
    });

    if (currentText) parts.push({ text: currentText, bold: false });

    // Simplificamos la lógica del split para la demo, la lógica original era más compleja para manejar múltiples highlights.
    // Usaremos la lógica de la función original, asumiendo que el texto se procesa correctamente.

    // === Lógica de la función original para manejar los segmentos ===
    let tempText = text;
    const finalParts = [];
    highlights.forEach(highlight => {
        const partsToProcess = tempText.split(new RegExp(`(${highlight.text})`, 'g'));
        
        for (let i = 0; i < partsToProcess.length; i++) {
            const part = partsToProcess[i];
            if (!part) continue;

            if (i % 2 === 1) { // El patrón capturado (el highlight) está en las posiciones impares
                finalParts.push({ text: part, bold: true });
            } else { // El texto antes y después está en las posiciones pares
                finalParts.push({ text: part, bold: false });
            }
        }
        tempText = ''; // Asumimos que la lógica de la app original maneja esto correctamente
    });
    if (finalParts.length === 0 && text) {
        finalParts.push({ text: text, bold: false });
    }
    // =================================================================

    return (
        <Text style={{
            fontSize: fontSize || 10,
            fontFamily: fontFamily || undefined,
        }}>
            {finalParts.map((part, index) => (
                <Text key={index} style={part.bold ? combinedStyles.staticTextBold : combinedStyles.staticText}>
                    {part.text}
                </Text>
            ))}
        </Text>
    );
};
// =================================================================
// 3. COMPONENTE MAGNIFYING GLASS (Nuevo)
// =================================================================
//const MAGNIFIER_SIZE = 160;
//const ZOOM_FACTOR = 2.9;

interface MagnifyingGlassProps {
    children: React.ReactNode;
    currentPosition: { x: number, y: number };
    onMove: (x: number, y: number) => void;
    galleryOffset: { x: number, y: number };
    
    // 📢 NUEVAS PROPS AGREGADAS AQUÍ:
    magnifierSize: number; 
    zoomFactor: number;
    divX: number;
    divY: number;
}

const MagnifyingGlassOverlay: React.FC<MagnifyingGlassProps> = ({ 
    children, 
    currentPosition, 
    onMove, 
    galleryOffset,
    // 📢 DESTRUCTURING DE LAS NUEVAS PROPS
    magnifierSize, 
    zoomFactor,
    divX, 
    divY,
}) => {
    const panResponder = useRef(
        // ... (PanResponder sin cambios) ...
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                onMove(
                    currentPosition.x + gestureState.dx,
                    currentPosition.y + gestureState.dy
                );
            },
            onPanResponderRelease: () => {
                // ...
            },
        })
    ).current;

    // --- CÁLCULO DE TRANSFORMACIÓN MODIFICADO ---
    
    // 1. Posición de la lupa relativa al TOP-LEFT de la PANTALLA
    const absoluteX = currentPosition.x;
    const absoluteY = currentPosition.y;

    // 2. Posición de la lupa relativa al TOP-LEFT de la GALERÍA
    const relativeX = absoluteX - galleryOffset.x;
    const relativeY = absoluteY - galleryOffset.y;

    // Convertimos los porcentajes divX/divY (ej: 35) a un factor de 0 a 1 (ej: 0.35)
    const divXFactor = divX / 100; // 👈 ¡Esta línea es clave!
    const divYFactor = divY / 100; 

    // Calculamos el desplazamiento del contenido CLONADO
    const anclaX = magnifierSize * divXFactor;
    const anclaY = magnifierSize * divYFactor;

    const DivX = 0.32; // Ajuste fino horizontal
    const DivY = 0.9;  // Ajuste fino vertical

    // 3. Calculamos la transformación del contenido CLONADO
    // Desplazamos el contenido en dirección opuesta a la lupa, ampliado por el zoom,
    // y lo centramos en el círculo.
    const transformX = -relativeX * zoomFactor + magnifierSize / divX;
    const transformY = -relativeY * zoomFactor + magnifierSize / divY;

    return (
        <View
            // Posición de la lupa en la pantalla (círculo)
            style={{
                position: 'absolute',
                // 📢 USAMOS magnifierSize
                top: absoluteY - magnifierSize / 2,
                left: absoluteX - magnifierSize / 2,
                width: magnifierSize,
                height: magnifierSize,
                borderRadius: magnifierSize / 2,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'black',
                zIndex: 10,
                backgroundColor: 'transparent',
            }}
            {...panResponder.panHandlers}
        >
            <View
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    // Aplicamos la transformación compensada
                    transform: [
                        { translateX: transformX },
                        { translateY: transformY },
                        { scale: zoomFactor },
                    ],
                }}
            >
                {children}
            </View>
        </View>
    );
};



const DEFAULT_MAGNIFIER_SIZE = 160;
const DEFAULT_ZOOM_FACTOR = 2;
const DEFAULT_DIV_X = 2;
const DEFAULT_DIV_Y = 2;


const INCH_PER_DP_DEFAULT = 160; // 160 DP por pulgada es el estándar de Android base

const getScreenSizeInInches = () => {
    const { width, height } = Dimensions.get('window');
    
    // Obtener la densidad de píxeles (escala)
    const pixelDensity = PixelRatio.get();
    
    // Calcular el tamaño físico de la pantalla en DP (o píxeles convertidos)
    const widthInDp = width;  // Dimensions.get('window') ya retorna en DP
    const heightInDp = height;

    // Calcular la diagonal en DP
    const diagonalInDp = Math.sqrt(Math.pow(widthInDp, 2) + Math.pow(heightInDp, 2));

    // Estimar la diagonal en pulgadas
    // El tamaño de la pantalla en pulgadas es la diagonal en DP dividida por la densidad DP/pulgada.
    // Usamos una aproximación estándar: diagonalInDp / (160 * scale)
    // Pero en React Native, la forma más sencilla es dividir por la densidad base (160) y luego por la escala,
    // o usar la fórmula de diagonal en píxeles dividida por DPI real.
    
    // Usaremos una aproximación basada en la diagonal en DP y el PixelRatio.getDpi() si estuviera disponible,
    // pero para mantenerlo simple y usar solo lo que tenemos:
    
    // El tamaño real de la pantalla en pulgadas depende del DPI real del dispositivo.
    // Una aproximación simple y común es asumir que 1 DP equivale a 1/160 de pulgada en densidad base (mdpi).
    
    // En React Native (simplificado):
    // const realDPI = PixelRatio.get() * 160; // DPI estimado
    // const diagonalInPx = Math.sqrt(Math.pow(width * pixelDensity, 2) + Math.pow(height * pixelDensity, 2));
    // const inches = diagonalInPx / realDPI; 
    
    // Simplificando aún más para obtener un valor representativo:
    const diagonalInInchesRepresentative = diagonalInDp / 160 * 0.9; // Ajuste empírico

    // Simplemente retornaremos la diagonal en DP para la lógica interna, 
    // y la mapearemos a los valores que nos diste (6.1, 6.4)
    return diagonalInInchesRepresentative; 
};

// =================================================================
// 4. COMPONENTE GALERIAMP (Modificado)
// =================================================================

const GaleriaMp = ({ data, opcionSeleccionada, toggleMenu, menuVisible }: GaleriaProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const flatListRef = useRef<FlatList<GalleryItem>>(null);
    const galleryContainerRef = useRef<View>(null); // Ref para el contenedor de la galería
    const [galleryContainerLayout, setGalleryContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 }); // Posición de la galería en la pantalla

    const [galleryDimensions, setGalleryDimensions] = useState({
        width: screenWidth * 0.92,
        height: screenHeight * 0.6,
    });


// 📢 MÉTODO PARA OBTENER EL ANCHO EN DP (LA MÉTRICA DE CLASIFICACIÓN)
    const getDeviceClassificationMetric = () => {
        const { width, height } = Dimensions.get('window');
        const pixelRatio = PixelRatio.get();
        
        // Ancho en DP (Density-Independent Pixels)
        const dpWidth = width / pixelRatio; 

        console.log(`[PANTALLA] Ancho DP: ${dpWidth.toFixed(2)} dp`);
        
        return dpWidth;
    };
    
    // Clasificador del dispositivo
    const deviceMetric = getDeviceClassificationMetric();

    // 📢 FUNCIÓN PARA CALCULAR EL OFFSET (FACTOR DE CORRECCIÓN)
    // El offset se aplica al valor base de divX (que debe estar en formato 0.xx)
    const calculateDivXOffset = (baseDivX: number) => {
        
        // Clasificación basada en tus valores de Ancho en DP:
        // 6.4" (Emulador) -> ~914 DP
        // 5.7" (Emulador) -> ~829 DP
        // 6.1" (Físico)   -> ~803 DP
        
        let offset = 0;
        
        // 1. Pantallas 6.4" o mayores (Ancho DP >= 860, usando un rango conservador)
        if (deviceMetric >= 860) {
            // Corrección: sumar 0.01 al valor que se coloque en DivX
            offset = 0.01; 
            console.log(`[AJUSTE] Dispositivo 6.4"+ (Ancho DP >= 860). Offset: +0.01`);
        } 
        // 2. Pantallas 6.1" (Ancho DP entre 780 y 860, cerca del valor de 803.2)
        else if (deviceMetric >= 780 && deviceMetric < 860) {
            // Corrección: sumar 0.05 al valor que se coloque en DivX
            offset = 0.05; 
            console.log(`[AJUSTE] Dispositivo 6.1" (Ancho DP 780-860). Offset: +0.05`);
        } 
        // 3. Pantallas 5.7" o menores (Ancho DP < 780, cerca del valor de 829, pero 
        //    este valor parece ser el más alto de tu rango "pequeño", lo ajustamos
        //    a los que son realmente más pequeños en DP, si los hubiera)
        // **IMPORTANTE**: Basado en tus datos, 829 DP (5.7") es más grande que 803 DP (6.1"). 
        // Vamos a asumir que el **RANGO** de 5.7" (829 DP) es el que requiere el offset +0.03.
        else if (deviceMetric >= 820 && deviceMetric < 860) { 
             // Ajuste para el rango de 829 DP (5.7")
            offset = 0.03;
            console.log(`[AJUSTE] Dispositivo 5.7" (Ancho DP 820-860). Offset: +0.03`);
        }
        else {
             console.log(`[AJUSTE] Sin ajuste específico. Offset: 0.00`);
        }
        
        // Aplicamos el offset. El valor de divX en los datos debe estar en formato decimal (0.xx).
        return baseDivX + offset;
    };

    // 📢 NUEVA LÓGICA DE INICIALIZACIÓN
const getInitialMagnifierSettings = () => {
    // Definimos los fallbacks en formato decimal (0.xx)
    const FALLBACK_DIVX = 0.32; 
    const FALLBACK_DIVY = 0.9;
    const FALLBACK_SIZE = 160;
    const FALLBACK_ZOOM = 2.9;
    
    // 1. Buscamos el primer botón que defina la configuración
    for (const botones of data.botones) {
        const defaultButton = botones.find(
            (b) => b.type === 'TxtButtonImg' && (b as TxtButtonImg).magnifierSize !== undefined
        ) as TxtButtonImg | undefined;

        if (defaultButton) {
            const baseDivX = defaultButton.divX !== undefined ? defaultButton.divX : FALLBACK_DIVX;
            
            return {
                size: defaultButton.magnifierSize || FALLBACK_SIZE,
                zoom: defaultButton.zoomFactor || FALLBACK_ZOOM,
                
                // 📢 APLICAMOS LA CORRECCIÓN AL VALOR BASE (del botón o fallback)
                divX: calculateDivXOffset(baseDivX), 
                
                divY: defaultButton.divY || FALLBACK_DIVY,
            };
        }
    }
    
    // 2. Fallback si no se encuentra ningún botón
    return {
        size: FALLBACK_SIZE,
        zoom: FALLBACK_ZOOM,
        divX: calculateDivXOffset(FALLBACK_DIVX), // Aplicamos corrección al fallback
        divY: FALLBACK_DIVY,
    };
};
    

    

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

    // NUEVO ESTADO PARA LA LUPA
    const [magnifierVisible, setMagnifierVisible] = useState(false);
    const [magnifierPosition, setMagnifierPosition] = useState({ x: screenWidth / 2, y: screenHeight / 2 });
    // Ref para el contenido completo que se clonará en la lupa (solo el contenedor de la galería)
    const galleryContentRef = useRef<View>(null); 
    const [magnifierSettings, setMagnifierSettings] = useState(getInitialMagnifierSettings);
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
                height: isPortrait ? height * 0.7 : height * 0.9,
            });

            if (!isInitialized) setIsInitialized(true);
        };

        updateDimensions();
        const subscription = Dimensions.addEventListener('change', updateDimensions);
        return () => subscription.remove();
    }, [screenWidth, screenHeight, isInitialized]);



    // Ocultar popups al cambiar de opción/galería
    useEffect(() => {
        if (isInitialized && flatListRef.current && data.imagenes.length > 0) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
            setIndexActual(0);
        }
    }, [opcionSeleccionada, data, isInitialized]);

    useEffect(() => {
        hideAllPopups();
        setMagnifierVisible(false); // Ocultar lupa al cambiar de opción
    }, [opcionSeleccionada]);

        useEffect(() => {
        // ... (Lógica para FlatList) ...
        
        // 📢 RESTABLECER LA CONFIGURACIÓN DE LA LUPA CADA VEZ QUE CAMBIE LA OPCIÓN
        setMagnifierVisible(false);
        setMagnifierSettings(getInitialMagnifierSettings());
    }, [opcionSeleccionada, data, isInitialized]);

    const galleryItems: GalleryItem[] = data.imagenes.map((img, idx) => ({
        image: Array.isArray(img) ? img : [img],
        buttons: data.botones[idx] || [],
    }));

    const viewabilityConfig = { viewAreaCoveragePercentThreshold: 80 };
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
            if (viewableItems.length > 0) {
                setIndexActual(viewableItems[0].index ?? 0);
                hideAllPopups();
            }
        },
    ).current;

    const irAImagen = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        hideAllPopups();
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



    
    // Obtener el tamaño del dispositivo (solo una vez)
    //const deviceInches = getDeviceDiagonalInches();

const handleButtonPress = (button: ButtonData, btnIdx: number) => {
    const currentContentId = `${button.type}_${btnIdx}`;

    // -----------------------------------------------------------------------
    // 1. LÓGICA DE CIERRE POR DOBLE CLIC (Toggling)
    // -----------------------------------------------------------------------
    if (activeContent === currentContentId) {
        hideAllPopups();
        setActiveContent(null);
        
        // Si el elemento activo era el botón de la lupa, la apagamos.
        if (button.type === 'TxtButtonImg') {
            setMagnifierVisible(false);
        }
        return;
    }

    // -----------------------------------------------------------------------
    // 2. LÓGICA DE PRIMER CLIC (Abrir nuevo elemento)
    // -----------------------------------------------------------------------
    
    // Ocultar todos los popups ANTES de abrir uno nuevo
    hideAllPopups();
    setActiveContent(currentContentId);

    // Si abrimos CUALQUIER botón que NO sea la Lupa, la Lupa debe cerrarse.
    if (button.type !== 'TxtButtonImg') {
         setMagnifierVisible(false); 
    }


    if (button.type === 'info') {
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

        const finalX = imageButton.popupImageX !== undefined ? (imageButton.popupImageX / 100) * screenWidth : (screenWidth - screenWidth * 0.7) / 2;
        const finalY = imageButton.popupImageY !== undefined ? (imageButton.popupImageY / 100) * screenHeight : (screenHeight - screenHeight * 0.6) / 2;
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
            const textWidth = imageButton.popupTextWidth !== undefined ? `${imageButton.popupImageWidth}%` : '90%';
            const textHeight = imageButton.popupTextHeight !== undefined ? `${imageButton.popupTextHeight}%` : 'auto';

            setPopupTextDynamicStyle({
                left: textX,
                top: textY === 'auto' ? undefined : textY,
                width: textWidth,
                height: textHeight === 'auto' ? undefined : textHeight,
                bottom: textY === 'auto' ? 20 : undefined,
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
        
        // -----------------------------------------------------------------------
        // 3. LÓGICA DEL BOTÓN DE LUPA (TxtButtonImg)
        // -----------------------------------------------------------------------

        // 3a. Aplicar ajustes de lupa si existen
        const newSettings = { ...magnifierSettings };
        
        const baseDivX = txtButtonImg.divX !== undefined ? txtButtonImg.divX : newSettings.divX;

        if (txtButtonImg.magnifierSize !== undefined) newSettings.size = txtButtonImg.magnifierSize;
        if (txtButtonImg.zoomFactor !== undefined) newSettings.zoom = txtButtonImg.zoomFactor;
        
        // 📢 APLICAMOS LA CORRECCIÓN AL VALOR DEL BOTÓN O AL VALOR ACTUAL DEL ESTADO
        newSettings.divX = calculateDivXOffset(baseDivX); 
        
        if (txtButtonImg.divY !== undefined) newSettings.divY = txtButtonImg.divY;

        setMagnifierSettings(newSettings);
        
        // 3b. Activar la Lupa (ya hemos cerrado los popups y limpiado activeContent)
        //setMagnifierVisible(true);

        // 3c. Si el TxtButtonImg debe mostrar InfoBox (opcional/combinado), lo mostramos:
        if (txtButtonImg.infoText || txtButtonImg.infoImage) {
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
    }
};
    const hideAllPopups = () => {
        setInfoBoxVisible(false);
        setPopupImageVisible(false);
        setInfoImageVisible(false);
        setPopupTextVisible(false);
        setActiveContent(null);
    };

    // FUNCIÓN PARA CALCULAR LA POSICIÓN DE LA LUPA RELATIVA AL CONTENEDOR DE LA GALERÍA
    const handleMagnifierMove = (x: number, y: number) => {
        // Aseguramos que la lupa no se salga de los límites de la pantalla
        const clampedX = Math.max(DEFAULT_MAGNIFIER_SIZE / 2, Math.min(x, screenWidth - DEFAULT_MAGNIFIER_SIZE / 2));
        const clampedY = Math.max(DEFAULT_MAGNIFIER_SIZE / 2, Math.min(y, screenHeight - DEFAULT_MAGNIFIER_SIZE / 2));

        // Mantenemos la posición CLAMPED (abosluta en pantalla)
        setMagnifierPosition({ x: clampedX, y: clampedY });
    };
    
    // Obtener la posición global de la galería al montar
    const onGalleryLayout = () => {
        if (galleryContainerRef.current) {
            galleryContainerRef.current.measure((x, y, width, height, pageX, pageY) => {
                setGalleryContainerLayout({ x: pageX, y: pageY, width, height });
            });
        }
    };

    const mostrarFlechas = galleryItems.length > 1;

    const dynamicStyles = StyleSheet.create({
        // ... (Estilos dinámicos existentes) ...
        container: {
            height: galleryDimensions.height + 20,
            width: '100%',
        },
        itemContainer: {
            height: galleryDimensions.height,
        },
        // ... (otros estilos dinámicos) ...
        popupTextBox: {
            position: 'absolute',
            backgroundColor: 'rgba(82, 82, 82, 0.6)',
            borderRadius: 10,
            borderWidth: 1,
            padding: 5,
            zIndex: 5,
            textAlign: 'justify',
        },
        popupTextBoxText: {
            color: 'white',
            fontSize: 12,
            textAlign: 'justify',
            padding: 5,
        },
        staticTextContainer: {
            position: 'absolute',
            backgroundColor: 'trasnparent',
            justifyContent: 'center',
            zIndex: 3,
            borderRadius: 10,
        },
        staticText: {
            color: 'black',
            fontSize: 12,
            fontWeight: 'normal',
            textAlign: 'left',
        },
        staticTextBold: {
            color: 'black',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'left',
        },
        // NUEVOS ESTILOS PARA LA LUPA
        magnifierButton: {
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 11,
            padding: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 20,
            borderWidth: 1,
            
        },
    });

    const combinedStyles = {
        ...styles,
        ...dynamicStyles,
    };

    // Función para renderizar el contenido actual de la galería (para el clon)
    const renderGalleryContent = () => {
        const item = galleryItems[indexActual];
        if (!item) return null;

        const ladoIzquierdo = item.image[0] || [];
        const ladoDerecho = item.image[1] || [];

        return (
            <View
                ref={galleryContentRef} // Usamos esta referencia para el clon
                style={[
                    combinedStyles.itemContainer,
                    {
                        width: screenWidth,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                ]}
                onLayout={onGalleryLayout} // Capturar el layout
            >
                <View style={styles.backgroundImagesContainer}>
                    {/* Lado Izquierdo */}
                    <View style={combinedStyles.sideContainer}>
                        {ladoIzquierdo.map((img: any, index: number) => (
                            <Image
                                key={`left-${index}`}
                                source={img}
                                style={combinedStyles.sideImage}
                                resizeMode="contain"
                            />
                        ))}
                    </View>
                    {/* Lado Derecho */}
                    <View style={combinedStyles.sideContainer}>
                        {ladoDerecho.map((img: any, index: number) => (
                            <Image
                                key={`right-${index}`}
                                source={img}
                                style={combinedStyles.sideImage}
                                resizeMode="contain"
                            />
                        ))}
                    </View>
                </View>

                {/* Botones y Texto Estático */}
                {item.buttons.map((button, btnIdx) => {
                    const realPos = calculateRealPosition(button);

                    if (button.type === 'staticText') {
                        const staticTextButton = button as StaticTextData;
                        return (
                            <View
                                key={btnIdx}
                                style={[
                                    combinedStyles.staticTextContainer,
                                    {
                                        left: realPos.x,
                                        top: realPos.y,
                                        width: realPos.width,
                                        height: realPos.height,
                                    },
                                    staticTextButton.rotateDeg !== undefined
                                        ? { transform: [{ rotate: `${staticTextButton.rotateDeg}deg` }] }
                                        : undefined,
                                ]}
                            >
                                {renderStyledText(staticTextButton.text, staticTextButton.textHighlights, staticTextButton.fontSize, staticTextButton.fontFamily, combinedStyles)}
                            </View>
                        );
                    }

                    // Renderizar los demás tipos de botón como una "capa" visible
                    // Usamos un View en lugar de TouchableOpacity para evitar interacción
                    return (
                        <View
                            key={btnIdx}
                            style={[
                                combinedStyles.overlayButton,
                                {
                                    left: realPos.x,
                                    top: realPos.y,
                                    width: realPos.width,
                                    height: realPos.height,
                                    opacity: 1, // Asegurarse de que sea visible
                                },
                                button.rotateDeg !== undefined
                                    ? { transform: [{ rotate: `${button.rotateDeg}deg` }] }
                                    : undefined,
                                (button.type === 'image' || button.type === 'ImgBtn' || button.type === 'TxtButtonImg') && { backgroundColor: 'lightgrey', borderWidth: 0, padding: 8 },
                            ]}
                        >
                            {(button.type === 'image' && (button as ImageButtonDataP).buttonImageSource) ||
                                (button.type === 'ImgBtn' && (button as ImgButton).buttonImageSource) ||
                                (button.type === 'TxtButtonImg' && (button as TxtButtonImg).buttonImageSource) ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%' }}>
                                        <Text style={{ color: 'black', fontSize: 12, fontWeight: 'bold', flex: 1, marginLeft: 4 }}>
                                            {button.text}
                                        </Text>
                                        <Image
                                            source={
                                                button.type === 'image'
                                                    ? (button as ImageButtonDataP).buttonImageSource
                                                    : button.type === 'ImgBtn'
                                                        ? (button as ImgButton).buttonImageSource
                                                        : (button as TxtButtonImg).buttonImageSource
                                            }
                                            style={[combinedStyles.buttonBackgroundImage, { position: 'relative', width: 38, height: 38, marginLeft: 4, }]}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <Text style={combinedStyles.overlayButtonText}>{button.text}</Text>
                                )}
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={combinedStyles.container} onLayout={onGalleryLayout} ref={galleryContainerRef}>
            {/* -------------------- BOTÓN DE LUPA (NUEVO) -------------------- */}
            {/* <TouchableOpacity
                style={dynamicStyles.magnifierButton}
                onPress={() => {
                    hideAllPopups();
                    setMagnifierVisible(!magnifierVisible);
                }}
            >
                <Text style={{ color: 'white', fontSize: 20 }}>{magnifierVisible ? '✖' : '🔎'}</Text>
            </TouchableOpacity> */}
            {/* --------------------------------------------------------------- */}
            
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
                    renderItem={({ item, index }) => {
                        const ladoIzquierdo = item.image[0] || [];
                        const ladoDerecho = item.image[1] || [];

                        // Solo renderiza el contenido interactivo/botones para el índice actual
                        const isCurrentIndex = index === indexActual;

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

                                <View style={styles.backgroundImagesContainer}>
                                    {/* Lado Izquierdo */}
                                    <View style={combinedStyles.sideContainer}>
                                        {ladoIzquierdo.map((img: any, idx: number) => (
                                            <Image
                                                key={`left-${idx}`}
                                                source={img}
                                                style={combinedStyles.sideImage}
                                                resizeMode="contain"
                                            />
                                        ))}
                                    </View>
                                    {/* Lado Derecho */}
                                    <View style={combinedStyles.sideContainer}>
                                        {ladoDerecho.map((img: any, idx: number) => (
                                            <Image
                                                key={`right-${idx}`}
                                                source={img}
                                                style={combinedStyles.sideImage}
                                                resizeMode="contain"
                                            />
                                        ))}
                                    </View>
                                </View>
                                
                                {isCurrentIndex && item.buttons.map((button, btnIdx) => {
                                    const realPos = calculateRealPosition(button);
                                    
                                    if (button.type === 'staticText') {
                                        const staticTextButton = button as StaticTextData;
                                        return (
                                            <View
                                                key={btnIdx}
                                                style={[
                                                    combinedStyles.staticTextContainer,
                                                    {
                                                        left: realPos.x,
                                                        top: realPos.y,
                                                        width: realPos.width,
                                                        height: realPos.height,
                                                    },
                                                    staticTextButton.rotateDeg !== undefined
                                                        ? { transform: [{ rotate: `${staticTextButton.rotateDeg}deg` }] }
                                                        : undefined,
                                                ]}
                                            >
                                                {renderStyledText(staticTextButton.text, staticTextButton.textHighlights, staticTextButton.fontSize, staticTextButton.fontFamily, combinedStyles)}
                                            </View>
                                        );
                                    }

                                    // Renderizar los demás tipos de botón como TouchableOpacity
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
                                                (button.type === 'image' || button.type === 'ImgBtn' || button.type === 'TxtButtonImg') && { backgroundColor: 'lightgrey', borderWidth: 0, padding: 8 },
                                            ]}
                                            onPress={() => handleButtonPress(button, btnIdx)}
                                        >
                                            {(button.type === 'image' && (button as ImageButtonDataP).buttonImageSource) ||
                                            (button.type === 'ImgBtn' && (button as ImgButton).buttonImageSource) ||
                                            (button.type === 'TxtButtonImg' && (button as TxtButtonImg).buttonImageSource) ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%' }}>
                                                    <Text style={{ color: 'black', fontSize: 12, fontWeight: 'bold', flex: 1, marginLeft: 4 }}>
                                                        {button.text}
                                                    </Text>
                                                    <Image
                                                        source={
                                                            button.type === 'image'
                                                                ? (button as ImageButtonDataP).buttonImageSource
                                                                : button.type === 'ImgBtn'
                                                                    ? (button as ImgButton).buttonImageSource
                                                                    : (button as TxtButtonImg).buttonImageSource
                                                        }
                                                        style={[combinedStyles.buttonBackgroundImage, { position: 'relative', width: 38, height: 38, marginLeft: 4, }]}
                                                        resizeMode="contain"
                                                    />
                                                </View>
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
                        index,
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

            {/* Renderizado de popups (idéntico al original) */}
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
                <View style={[combinedStyles.infoBox, infoBoxDynamicStyle, { zIndex: 2 }]}>
                    {/* Botón de cierre en la esquina superior izquierda */}
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: 'red',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 3,
                        }}
                        onPress={() => {
                            setInfoBoxVisible(false);
                            setMagnifierVisible(false); // Cierra la lupa
                            setInfoImageVisible(false);
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>

                    {/* Contenido del cuadro de texto */}
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

            {/* -------------------- OVERLAY DE LUPA (NUEVO) -------------------- */}
            {magnifierVisible && galleryContainerLayout.width > 0 && (
                <MagnifyingGlassOverlay
                    currentPosition={magnifierPosition} 
                    onMove={handleMagnifierMove}
                    galleryOffset={{ x: galleryContainerLayout.x, y: galleryContainerLayout.y }}
                    
                    // 📢 PASAMOS LOS VALORES DEL ESTADO
                    magnifierSize={magnifierSettings.size}
                    zoomFactor={magnifierSettings.zoom}
                    divX={magnifierSettings.divX}
                    divY={magnifierSettings.divY}
                >
                    {renderGalleryContent()}
                </MagnifyingGlassOverlay>
            )}
            {/* ------------------------------------------------------------------ */}
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
    backgroundImagesContainer: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'center', // Centra los dos sideContainers dentro de este contenedor
        alignItems: 'center', // Para centrar verticalmente si los sideContainers no ocupan el 100% de la altura
    },
    sideContainer: {
        width: '35%', // **MODIFICADO**: Cada lado ocupa el 45% del ancho total
                      // Esto dejará un 10% de espacio en el medio (100 - 45 - 45 = 10)
        height: '100%',
        position: 'relative',
        alignItems: 'center', // Centra las imágenes superpuestas dentro de su sideContainer
        justifyContent: 'center', // Centra las imágenes superpuestas dentro de su sideContainer
    },
    sideImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
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
        borderWidth: 0,
        backgroundColor: 'rgba(101, 100, 100, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        borderRadius: 5,
    },
    overlayButtonText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'light',
        textAlign: 'justify',
        padding: 5,
    },
    infoBox: {
        position: 'absolute',
        backgroundColor: 'rgba(77, 77, 77, 0.98)',
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
        borderWidth: 0,
        borderColor: 'black',
        borderRadius: 10,
        backgroundColor: 'lightgrey',

    },
    // Estilo agregado para evitar error: combinedStyles.infoImageOverlay
    infoImageOverlay: {
        position: 'absolute',
        width: '80%',
        height: '80%',
        alignSelf: 'center',
        borderRadius: 12,
    },
    menuButtonImage: {
        width: 40,
        height: 40,
    },
});

export default GaleriaMp;