// src/pages/Admin/Business/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBusiness, updateBusiness, createBusiness } from '../../../api/admin/business';
import BusinessForm from '../../../components/Admin/Business/BusinessForm';

const BusinessDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Mejor forma de detectar si es creación
  const isNew = location.pathname.endsWith('/new');

  // Query solo para edición
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => getBusiness(id!),
    enabled: !!id && !isNew, // Solo ejecutar si hay ID y no es nuevo
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createBusiness(data) : updateBusiness(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      navigate('/admin/business');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Negocio' : 'Editar Negocio'}
      </h1>
      <BusinessForm 
        initialData={isNew ? null : business} // Envía null explícito para creación
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default BusinessDetailPage;