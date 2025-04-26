// src/pages/Admin/Business/BusinessPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBusinesses, deleteBusiness } from '../../../api/admin/business';
import BusinessList from '../../../components/Admin/Business/BusinessList';
import { Link } from 'react-router-dom';

const BusinessPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['businesses', page],
    queryFn: () => getBusinesses(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      // Invalida todas las páginas porque el count puede cambiar
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este negocio?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando negocios...</div>;
  if (error) return <div>Error al cargar negocios</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Negocios</h1>
        <Link
          to="/admin/business/new"
 className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Negocio
        </Link>
      </div>
      
      <BusinessList 
  businesses={data?.results || []}  // Ahora results contiene el array
  onDelete={handleDelete}
  currentPage={page}
  totalPages={Math.ceil((data?.count || 0) / 10)}  // Calcula total_pages basado en count
  onPageChange={setPage}
/>
    </div>
  );
};

export default BusinessPage;