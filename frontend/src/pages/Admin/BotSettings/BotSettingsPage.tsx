// frontend/src/pages/Admin/BotSettings/BotSettingsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBotSettings, deleteBotSetting,getBotSettingByBusiness } from '../../../api/admin/botSettings';
import BotSettingsList from '../../../components/Admin/BotSettings/BotSettingsList';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { BotSetting, BotSettingsResponse } from '../../../types/botSettings';

const BotSettingsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { user, isSuperuser } = useAuth();
  
  const { data, isLoading, error } = useQuery<BotSettingsResponse | BotSetting | null>({
    queryKey: ['botSettings', page],
    queryFn: () => {
      if (isSuperuser) {
        return getBotSettings(page); // Admin global ve todos
      } else if (user?.business?.id) {
        return getBotSettingByBusiness(user.business.id); // Usuario de negocio ve solo el suyo
      }
      return Promise.resolve(null);
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBotSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botSettings'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta configuración de bot?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando configuraciones de bot...</div>;
  if (error) return <div>Error al cargar configuraciones de bot</div>;

  // Para usuarios de negocio, data es un solo objeto, no un array
  const settingsList = isSuperuser ? (data as BotSettingsResponse)?.results || [] : data ? [data] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuraciones del Bot</h1>
        {(!user?.business || isSuperuser) && (
          <Link
            to="/admin/bot-settings/new"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
          >
            Crear Configuración
          </Link>
        )}
      </div>
      
      <BotSettingsList 
        settings={settingsList as BotSetting[]}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={isSuperuser ? Math.ceil((data as BotSettingsResponse)?.count || 0 / 10) : 1}
        onPageChange={setPage}
      />
    </div>
  );
};

export default BotSettingsPage;