// frontend/src/api/admin/productsServices.ts
import api from '../axiosConfig';
import { ProductService, ProductsServicesResponse } from '../../types/productService';
import { getBusiness } from './business';

const enrichWithBusiness = async (item: any): Promise<ProductService> => {
  const business = await getBusiness(item.business_id);
  return {
    ...item,
    business
  };
};

export const getProductsServices = async (page: number = 1): Promise<ProductsServicesResponse> => {
  const response = await api.get(`/product-service-items/?page=${page}`);
  //const enrichedResults = await Promise.all(response.data.results.map(enrichWithBusiness));
  return {
    ...response.data,
    //results: enrichedResults
  };
};

export const getProductService = async (id: string): Promise<ProductService> => {
  const response = await api.get(`/product-service-items/${id}/`);
  //return enrichWithBusiness(response.data);
  return response.data;
};

export const getProductsServicesByBusiness = async (businessId: string, page: number = 1): Promise<ProductsServicesResponse> => {
  const response = await api.get(`/product-service-items/by-business/${businessId}/?page=${page}`);
 // const business = await getBusiness(businessId);
 // const enrichedResults = response.data.results.map((item: any) => ({
 //   ...item,
 //   business
 // }));
  return {
    ...response.data,
    //results: enrichedResults
  };
};

export const createProductService = async (data: Partial<ProductService>): Promise<ProductService> => {
  const response = await api.post('/product-service-items/', data);
  return response.data;
};

export const updateProductService = async (id: string, data: Partial<ProductService>): Promise<ProductService> => {
  const response = await api.patch(`/product-service-items/${id}/`, data);
  return response.data;
};

export const deleteProductService = async (id: string): Promise<void> => {
  await api.delete(`/product-service-items/${id}/`);
};