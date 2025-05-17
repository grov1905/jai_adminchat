// frontend/src/pages/Admin/ProductsServices/ProductsServicesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsServices, deleteProductService, getProductsServicesByBusiness } from '../../../api/admin/productsServices';
import ProductsServicesList from '../../../components/Admin/ProductsServices/ProductsServicesList';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ProductService, ProductsServicesResponse } from '../../../types/productService';

const ProductsServicesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { user, isSuperuser } = useAuth();
  
  const { data, isLoading, error } = useQuery<ProductsServicesResponse | ProductService[]>({
    queryKey: ['productsServices', page],
    queryFn: async () => {
      if (isSuperuser) {
        return await getProductsServices(page);
      } else if (user?.business?.id) {
        return await getProductsServicesByBusiness(user.business.id, page);
      }
      return { results: [], count: 0 };
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsServices'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto/servicio?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando productos/servicios...</div>;
  if (error) return <div>Error al cargar productos/servicios</div>;

  const itemsList = isSuperuser 
    ? (data as ProductsServicesResponse)?.results || [] 
    : (data as ProductsServicesResponse)?.results || [];

  const totalPages = isSuperuser 
    ? Math.ceil(((data as ProductsServicesResponse)?.count || 0) / 10) 
    : 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos/Servicios</h1>
        <Link
          to="/admin/products-services/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Nuevo
        </Link>
      </div>
      
      <ProductsServicesList 
        items={itemsList}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default ProductsServicesPage;