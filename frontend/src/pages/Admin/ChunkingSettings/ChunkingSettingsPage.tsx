// src/pages/Admin/ChunkingSettings/ChunkingSettingsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChunkingSettings, deleteChunkingSetting, getChunkingSettingsByBusiness } from '../../../api/admin/chunkingSettings';
import ChunkingSettingsList from '../../../components/Admin/ChunkingSettings/ChunkingSettingsList';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ChunkingSettings, ChunkingSettingsResponse } from '../../../types/chunkingSettings';

const ChunkingSettingsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { user, isSuperuser } = useAuth();
  
  const { data, isLoading, error } = useQuery<ChunkingSettingsResponse | ChunkingSettings[] | null>({
    queryKey: ['chunkingSettings', page],
    queryFn: () => {
      if (isSuperuser) {
        return getChunkingSettings(page);
      } else if (user?.business?.id) {
        return getChunkingSettingsByBusiness(user.business.id);
      }
      return Promise.resolve(null);
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChunkingSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chunkingSettings'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta configuración de chunking?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando configuraciones de chunking...</div>;
  if (error) return <div>Error al cargar configuraciones de chunking</div>;

  // Para usuarios de negocio, data es un array de configuraciones
  const settingsList = isSuperuser ? (data as ChunkingSettingsResponse)?.results || [] : (data as ChunkingSettings[]) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuraciones de Chunking</h1>
        {(!user?.business || isSuperuser) && (
          <Link
            to="/admin/chunking-settings/new"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
          >
            Crear Configuración
          </Link>
        )}
      </div>
      
      <ChunkingSettingsList 
        settings={settingsList}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={isSuperuser ? Math.ceil((data as ChunkingSettingsResponse)?.count || 0 / 10) : 1}
        onPageChange={setPage}
      />
    </div>
  );
};

export default ChunkingSettingsPage;