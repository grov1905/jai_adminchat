import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, updateUser, createUser } from '../../../api/admin/users';
import UserForm from '../../../components/Admin/Users/UserForm';
import { useAuth } from '../../../contexts/AuthContext';


const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createUser(data) : updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/admin/users');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  // Solo permitir editar si es superadmin (business es null) o es el propio usuario
  const canEdit = currentUser?.business === null || currentUser?.id === id;

  if (!isNew && isLoading) return <div>Cargando...</div>;
  if (!canEdit) return <div>No tienes permisos para editar este usuario</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Usuario' : 'Editar Usuario'}
      </h1>
      <UserForm 
        initialData={isNew ? null : user}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
        isSuperuser={currentUser?.business === null}
      />
    </div>
  );
};

export default UserDetailPage;