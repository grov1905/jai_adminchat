import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles, deleteRole } from '../../../api/admin/roles';
import RoleList from '../../../components/Admin/Roles/RoleList';
import { Link } from 'react-router-dom';

const RolesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['roles', page],
    queryFn: () => getRoles(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando roles...</div>;
  if (error) return <div>Error al cargar roles</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Roles</h1>
        <Link
          to="new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Rol
        </Link>
      </div>
      
      <RoleList 
        roles={data?.results || []}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={Math.ceil((data?.count || 0) / 10)}
        onPageChange={setPage}
      />
    </div>
  );
};

export default RolesPage;