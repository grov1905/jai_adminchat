// frontend/src/pages/Admin/ProductsServices/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductService, updateProductService, createProductService } from '../../../api/admin/productsServices';
import ProductServiceForm from '../../../components/Admin/ProductsServices/ProductServiceForm';

const ProductServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: item, isLoading } = useQuery({
    queryKey: ['productService', id],
    queryFn: () => getProductService(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createProductService(data) : updateProductService(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsServices'] });
      navigate('/admin/products-services');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Producto/Servicio' : 'Editar Producto/Servicio'}
      </h1>
      <ProductServiceForm 
        initialData={isNew ? null : item}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default ProductServiceDetailPage;