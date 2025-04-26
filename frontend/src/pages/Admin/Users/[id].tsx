// src/pages/Admin/Users/[id].tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, updateUser, createUser } from '../../../api/admin/users';
import UserForm from '../../../components/Admin/Users/UserForm';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Mejor forma de detectar si es creación
  const isNew = location.pathname.endsWith('/new');


  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => (isNew ? Promise.resolve(null) : getUser(id!)),
    enabled: !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isNew ? createUser(data) : updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/admin/users');
    },
  });

  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Usuario' : 'Editar Usuario'}
      </h1>
      <UserForm 
        initialData={isNew ? null : user} 
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default UserDetailPage;