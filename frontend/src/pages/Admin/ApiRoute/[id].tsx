
// src/pages/Admin/ApiRoute/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiRoute, updateApiRoute, createApiRoute } from '../../../api/admin/apiRoute';
import { getExternalApiConfigs } from '../../../api/admin/externalApiConfig';
import ApiRouteForm from '../../../components/Admin/ApiRoute/ApiRouteForm';

const ApiRouteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: route, isLoading } = useQuery({
    queryKey: ['apiRoute', id],
    queryFn: () => getApiRoute(Number(id!)),
    enabled: !!id && !isNew,
  });

  const { data: externalApiConfigs } = useQuery({
    queryKey: ['externalApiConfigsForSelect'],
    queryFn: () => getExternalApiConfigs(1, 100), // Asume que no hay más de 100 configs
    select: (data) => data.results.map(config => ({ id: config.id, name: config.name })),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const parsedData = {
        ...data,
        request_transformation: JSON.parse(data.request_transformation),
        response_transformation: JSON.parse(data.response_transformation),
      };
      return isNew ? createApiRoute(parsedData) : updateApiRoute(Number(id!), parsedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiRoutes'] });
      navigate('/admin/api-routes');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Ruta API' : 'Editar Ruta API'}
      </h1>
      <ApiRouteForm 
        initialData={isNew ? null : route}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
        externalApiConfigs={externalApiConfigs || []}
      />
    </div>
  );
};

export default ApiRouteDetailPage;