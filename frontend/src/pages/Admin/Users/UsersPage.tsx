import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser } from '../../../api/admin/users';
import UserList from '../../../components/Admin/Users/UserList';
import { Link } from 'react-router-dom';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Nuevo estado para tamaño de página
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getUsers(page, pageSize),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Si la página actual queda vacía después de eliminar, retrocede una página
      if (data?.results?.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1); // Resetear a primera página cuando cambia el tamaño
  };

  if (isLoading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error al cargar usuarios</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Link
          to="/admin/users/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Crear Usuario
        </Link>
      </div>
      
      <UserList 
      users={data?.results || []} 
      onDelete={handleDelete}
      currentPage={page}
      totalPages={Math.ceil((data?.count || 0) / pageSize)}  // Aquí se calcula
      totalItems={data?.count || 0}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={handlePageSizeChange}
    />
    </div>
  );
};

export default UsersPage;