// frontend/src/pages/Admin/Documents/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, updateDocument, createDocument } from '../../../api/admin/documents';
import DocumentForm from '../../../components/Admin/Documents/DocumentForm';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');
  console.log('id', id);
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createDocument(data) : updateDocument(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate('/admin/documents');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Subir Nuevo Documento' : 'Editar Documento'}
      </h1>
      <DocumentForm 
        initialData={isNew ? null : document}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default DocumentDetailPage;