
// src/pages/Admin/ExternalApiConfig/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExternalApiConfig, updateExternalApiConfig, createExternalApiConfig } from '../../../api/admin/externalApiConfig';
import ExternalApiConfigForm from '../../../components/Admin/ExternalApiConfig/ExternalApiConfigForm';

const ExternalApiConfigDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: config, isLoading } = useQuery({
    queryKey: ['externalApiConfig', id],
    queryFn: () => getExternalApiConfig(Number(id!)),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createExternalApiConfig(data) : updateExternalApiConfig(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalApiConfigs'] });
      navigate('/admin/external-api-configs');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Configuración API' : 'Editar Configuración API'}
      </h1>
      <ExternalApiConfigForm 
        initialData={isNew ? null : config}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default ExternalApiConfigDetailPage;
