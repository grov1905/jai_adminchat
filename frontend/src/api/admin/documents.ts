// frontend/src/api/admin/documents.ts
import api from '../axiosConfig';
import { Document, DocumentsResponse } from '../../types/document';
import { getBusiness } from './business';

const enrichWithBusiness = async (doc: any): Promise<Document> => {
  const business = await getBusiness(doc.business_id);
  return {
    ...doc,
    business
  };
};

export const getDocuments = async (page: number = 1): Promise<DocumentsResponse> => {
    const response = await api.get(`/documents/?page=${page}`);
    // Si no hay resultados, devolvemos una estructura válida pero vacía
    if (!response.data.results || response.data.results.length === 0) {
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
        total_pages: 0
      };
    }
    //const enrichedResults = await Promise.all(response.data.results.map(enrichWithBusiness));
    //console.log('enrichedResults', enrichedResults);

    return {
      ...response.data,
      results: response.data.results  
    };
  };

export const getDocument = async (id: string): Promise<Document> => {
  const response = await api.get(`/documents/${id}/`);
  console.log('response', response.data);
  //return enrichWithBusiness(response.data);
  return response.data;
};

export const getDocumentsByBusiness = async (businessId: string, page: number = 1): Promise<DocumentsResponse> => {
  const response = await api.get(`/documents/by-business/${businessId}/?page=${page}`);
  const business = await getBusiness(businessId);
  const enrichedResults = response.data.results.map((doc: any) => ({
    ...doc,
    business
  }));
  return {
    ...response.data,
    results: enrichedResults
  };
};

export const createDocument = async (data: Partial<Document>): Promise<Document> => {
  const response = await api.post('/documents/', data);
  return response.data;
};

export const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
  const response = await api.patch(`/documents/${id}/`, data);
  return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}/`);
};

