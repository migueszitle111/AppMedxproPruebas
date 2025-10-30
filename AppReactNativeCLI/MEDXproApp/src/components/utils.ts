import { Image } from 'react-native';

export const calculateAspectRatios = async (data: any[]) => {
  return Promise.all(
    data.map(
      (item) =>
        new Promise((resolve) => {
          Image.getSize(
            item.imagen,
            (width, height) => {
              resolve({ ...item, aspectRatio: width / height });
            },
            () => resolve({ ...item, aspectRatio: 1 }) // Si falla, asignar aspecto 1:1 por defecto
          );
        })
    )
  );
};
