// src/pages/Admin/ChunkingSettings/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChunkingSetting, updateChunkingSetting, createChunkingSetting } from '../../../api/admin/chunkingSettings';
import ChunkingSettingsForm from '../../../components/Admin/ChunkingSettings/ChunkingSettingsForm';

const ChunkingSettingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: setting, isLoading } = useQuery({
    queryKey: ['chunkingSetting', id],
    queryFn: () => getChunkingSetting(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createChunkingSetting(data) : updateChunkingSetting(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chunkingSettings'] });
      navigate('/admin/chunking-settings');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Configuración de Chunking' : 'Editar Configuración de Chunking'}
      </h1>
      <ChunkingSettingsForm 
        initialData={isNew ? null : setting}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default ChunkingSettingDetailPage;