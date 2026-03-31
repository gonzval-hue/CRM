import axios from 'axios';

const EVALUADOR_URL = 'https://propuestas.ingemedia.cl';

export interface EvaluadorTender {
  id: string; // Ej: 2784-18-LR26
  title: string;
  close_date?: string;
  // Otros campos vienen del buscador y dependerá de cómo estructuraste la respuesta de api_search.php
  [key: string]: any; 
}

export interface TenderDetail {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado: number;
  Descripcion: string;
  FechaCierre: string | null;
  Estado: string;
  Comprador: {
    NombreOrganismo: string;
  };
  MontoEstimado: number | null;
  // Añadir más campos según necesidad
  [key: string]: any;
}

export const fetchActiveTenders = async (): Promise<any> => {
  // Llama a api_fetch.php para forzar la actualización del JSON en el servidor
  const response = await axios.get(`${EVALUADOR_URL}/api_fetch.php`);
  return response.data;
};

export const searchTenders = async (titleKeyword: string = ''): Promise<EvaluadorTender[]> => {
  // Llama a api_search.php y le pasa la query para filtrar por título
  const response = await axios.get(`${EVALUADOR_URL}/api_search.php`, {
    params: { query: '', title: titleKeyword } 
  });
  // Ajustar esto según el formato real de tu JSON de búsqueda (ej response.data.data)
  return Array.isArray(response.data) ? response.data : response.data.data || [];
};

export const getTenderDetail = async (id: string): Promise<TenderDetail> => {
  // Llama a api_tender.php
  const response = await axios.get(`${EVALUADOR_URL}/api_tender.php`, {
    params: { id } // api_tender.php?id=...
  });
  
  // El pantallazo muestra { status: "success", data: { ... } }
  if (response.data && response.data.status === 'success') {
    return response.data.data;
  }
  
  throw new Error('Error al obtener el detalle de la licitación');
};
