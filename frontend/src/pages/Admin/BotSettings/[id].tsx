import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBotSetting, updateBotSetting, createBotSetting } from '../../../api/admin/botSettings';
import BotSettingForm from '../../../components/Admin/BotSettings/BotSettingForm';

const BotSettingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const isNew = location.pathname.endsWith('/new');

  const { data: setting, isLoading } = useQuery({
    queryKey: ['botSetting', id],
    queryFn: () => getBotSetting(id!),
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isNew ? createBotSetting(data) : updateBotSetting(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botSettings'] });
      navigate('/admin/bot-settings');
    },
  });
  
  const handleSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isNew && isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? 'Crear Configuración de Bot' : 'Editar Configuración de Bot'}
      </h1>
      <BotSettingForm 
        initialData={isNew ? null : setting}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};

export default BotSettingDetailPage;