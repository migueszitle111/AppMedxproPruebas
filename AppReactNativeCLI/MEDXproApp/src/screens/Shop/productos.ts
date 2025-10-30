// src/data/productos.ts
export interface Producto {
    id: string;
    titulo: string;
    precio: string;
    img?: any; // opcional
    descripcion: string;
    anuncio?: string;
  }

  export const productos: Producto[] = [
    {
      id: '1',
      titulo: 'Estudios de conducción nerviosa',
      precio: '$ 1,200.00',
      img: require('../../assets/shop/libro_conduccion_nerviosa.png'),
      descripcion: 'Manual sobre estudios de conducción nerviosa.',
      anuncio: 'Proximamente disponible',
    },
    {
      id: '2',
      titulo: 'Estudio de potenciales evocados',
      precio: '$ 1,200.00',
      img: require('../../assets/shop/potenciales_evocados.png'),
      descripcion: 'Manual sobre estudio de potenciales evocados.',
      anuncio: 'Proximamente disponible',
    },
  ];
