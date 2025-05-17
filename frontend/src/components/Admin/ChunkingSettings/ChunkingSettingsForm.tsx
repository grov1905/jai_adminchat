// src/components/Admin/ChunkingSettings/ChunkingSettingsForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { ChunkingSettings } from '../../../types/chunkingSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBusinesses } from '../../../api/admin/business';
import { Business } from '../../../types/business';

interface ChunkingSettingsFormProps {
  initialData?: ChunkingSettings | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const entityTypes = [
  { value: 'document', label: 'Documento' },
  { value: 'product_service_item', label: 'Ítem de Producto/Servicio' },
  { value: 'message', label: 'Mensaje' },
  { value: 'review', label: 'Reseña' },
  { value: 'other', label: 'Otro' },
];

const ChunkingSettingsForm = ({ initialData, onSubmit, isSubmitting }: ChunkingSettingsFormProps) => {
  const { user, isSuperuser } = useAuth();
  
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
    enabled: isSuperuser,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      business_id: user?.business?.id || '',
      entity_type: 'document',
      chunk_size: 1000,
      chunk_overlap: 200,
      ...initialData
    },
  });

  React.useEffect(() => {
    if (!isSuperuser && user?.business?.id) {
      setValue('business_id', user.business.id);
    }

    reset({
      business_id: isSuperuser ? initialData?.business_id || '' : user?.business?.id || '',
      entity_type: initialData?.entity_type || 'document',
      chunk_size: initialData?.chunk_size || 1000,
      chunk_overlap: initialData?.chunk_overlap || 200,
    });
  }, [initialData, reset, isSuperuser, user, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Configuración' : 'Crear Nueva Configuración'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Negocio */}
        <div className="md:col-span-2">
          <label htmlFor="business_id" className="block text-sm font-roboto font-medium text-primary mb-1">
            Negocio {!isSuperuser && '(Asignado)'}
          </label>
          
          {isSuperuser ? (
            <>
              <select
                id="business_id"
                {...register('business_id', { required: 'Este campo es requerido' })}
                className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
                  errors.business_id 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
                } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar negocio</option>
                {businesses?.results?.map((business: Business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              {errors.business_id && (
                <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
                  {errors.business_id.message}
                </p>
              )}
            </>
          ) : (
            <div className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-2 border border-gray-300">
              {user?.business?.name || 'No asignado'}
              <input
                type="hidden"
                {...register('business_id')}
              />
            </div>
          )}
        </div>

        {/* Tipo de Entidad */}
        <div>
          <label htmlFor="entity_type" className="block text-sm font-roboto font-medium text-primary mb-1">
            Tipo de Entidad *
          </label>
          <select
            id="entity_type"
            {...register('entity_type', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.entity_type 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          >
            {entityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.entity_type && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.entity_type.message}
            </p>
          )}
        </div>

        {/* Tamaño de Chunk */}
        <div>
          <label htmlFor="chunk_size" className="block text-sm font-roboto font-medium text-primary mb-1">
            Tamaño de Chunk *
          </label>
          <input
            type="number"
            id="chunk_size"
            {...register('chunk_size', { 
              required: 'Este campo es requerido',
              min: { value: 1, message: 'El valor mínimo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.chunk_size 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.chunk_size && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.chunk_size.message}
            </p>
          )}
        </div>

        {/* Solapamiento */}
        <div>
          <label htmlFor="chunk_overlap" className="block text-sm font-roboto font-medium text-primary mb-1">
            Solapamiento *
          </label>
          <input
            type="number"
            id="chunk_overlap"
            {...register('chunk_overlap', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.chunk_overlap 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.chunk_overlap && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.chunk_overlap.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-border">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center rounded-md border border-gray-border bg-white py-2 px-4 text-sm font-roboto font-medium text-secondary shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center rounded-md border border-transparent py-2 px-4 text-sm font-roboto font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 transition-all duration-200 ${
            isSubmitting 
              ? 'bg-primary-light cursor-not-allowed' 
              : 'bg-primary hover:bg-[#2a3a5f] active:bg-[#17233d]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default ChunkingSettingsForm;