// src/pages/Admin/ApiRoute/ApiRoutePage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiRoutes, deleteApiRoute } from '../../../api/admin/apiRoute';
import ApiRouteList from '../../../components/Admin/ApiRoute/ApiRouteList';
import { Link } from 'react-router-dom';

const ApiRoutePage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['apiRoutes', page],
    queryFn: () => getApiRoutes(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApiRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiRoutes'] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta ruta API?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando rutas API...</div>;
  if (error) return <div>Error al cargar rutas API</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rutas de APIs Externas</h1>
        <Link
          to="/admin/api-routes/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Ruta
        </Link>
      </div>
      
      <ApiRouteList 
        routes={data?.results || []}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={Math.ceil((data?.count || 0) / 10)}
        onPageChange={setPage}
      />
    </div>
  );
};

export default ApiRoutePage;