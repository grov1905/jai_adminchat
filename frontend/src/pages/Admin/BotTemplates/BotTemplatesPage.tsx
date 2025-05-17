import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBotTemplates, deleteBotTemplate, getBotTemplatesByType } from '../../../api/admin/botTemplates';
import BotTemplatesList from '../../../components/Admin/BotTemplates/BotTemplatesList';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { BotTemplatesResponse, BotTemplateType } from '../../../types/botTemplates';

const BotTemplatesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [templateType, setTemplateType] = useState<string>('all');
  const { user, isSuperuser } = useAuth();
  
  // Obtener business_id del usuario (null si es superuser)
  const businessId = user?.business?.id;

  const { data, isLoading, error } = useQuery<BotTemplatesResponse>({
    queryKey: ['botTemplates', page, templateType, businessId],
    queryFn: () => {
      if (!businessId && !isSuperuser) return Promise.resolve({ results: [], count: 0, next: null, previous: null });
      
      return templateType === 'all' 
        ? getBotTemplates(businessId || '', page) 
        : getBotTemplatesByType(businessId || '', templateType as BotTemplateType, page);
    },
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
  });

  
  const deleteMutation = useMutation({
    mutationFn: deleteBotTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botTemplates'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando plantillas...</div>;
  if (error) return <div>Error al cargar plantillas</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plantillas del Bot</h1>
       
          <Link
            to="/admin/bot-templates/new"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
          >
            Crear Plantilla
          </Link>
        
      </div>

      {/* Filtro por tipo de plantilla */}
      <div className="mb-4">
        <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-1">
          Filtrar por tipo:
        </label>
        <select
          id="templateType"
          value={templateType}
          onChange={(e) => {
            setTemplateType(e.target.value);
            setPage(1); // Resetear a primera página al cambiar filtro
          }}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md"
        >
          <option value="all">Todos</option>
          <option value="greeting">Saludo</option>
          <option value="farewell">Despedida</option>
          <option value="sales">Ventas</option>
          <option value="support">Soporte</option>
          <option value="other">Otros</option>
        </select>
      </div>
      
      <BotTemplatesList 
        templates={data?.results || []}
        onDelete={handleDelete}
        currentPage={page}
        totalPages={Math.ceil((data?.count || 0) / 10)}
        onPageChange={setPage}
        showBusinessColumn={isSuperuser} // Mostrar columna de negocio solo para superusers
      />
    </div>
  );
};

export default BotTemplatesPage;