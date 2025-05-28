// src/pages/Admin/BotTemplates/[id].tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBotTemplate, updateBotTemplate, createBotTemplate } from '../../../api/admin/botTemplates';
import BotTemplateForm from '../../../components/Admin/BotTemplates/BotTemplateForm';

const BotTemplateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: template, isLoading } = useQuery({
    queryKey: ['botTemplate', id],
    queryFn: () => getBotTemplate(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createBotTemplate(data) : updateBotTemplate(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botTemplates'] });
      navigate('/admin/bot-templates');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Plantilla' : 'Editar Plantilla'}
      </h1>
      <BotTemplateForm 
        initialData={isNew ? null : template}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default BotTemplateDetailPage;