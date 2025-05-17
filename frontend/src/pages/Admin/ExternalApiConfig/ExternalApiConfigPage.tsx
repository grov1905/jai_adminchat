// src/pages/Admin/ExternalApiConfig/ExternalApiConfigPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExternalApiConfigs, deleteExternalApiConfig } from '../../../api/admin/externalApiConfig';
import ExternalApiConfigList from '../../../components/Admin/ExternalApiConfig/ExternalApiConfigList';
import { Link } from 'react-router-dom';

const ExternalApiConfigPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['externalApiConfigs', page],
    queryFn: () => getExternalApiConfigs(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExternalApiConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalApiConfigs'] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta configuración de API?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando configuraciones de API...</div>;
  if (error) return <div>Error al cargar configuraciones de API</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuraciones de APIs Externas</h1>
        <Link
          to="/admin/external-api-configs/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Configuración
        </Link>
      </div>
      
      <ExternalApiConfigList 
        configs={data?.results || []}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={Math.ceil((data?.count || 0) / 10)}
        onPageChange={setPage}
      />
    </div>
  );
};

export default ExternalApiConfigPage;
