// frontend/src/components/Admin/BotSettings/BotSettingForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { BotSetting } from '../../../types/botSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBusinesses } from '../../../api/admin/business';
import { Business } from '../../../types/business';

interface BotSettingFormProps {
  initialData?: BotSetting | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const BotSettingForm = ({ initialData, onSubmit, isSubmitting }: BotSettingFormProps) => {
  const { user, isSuperuser } = useAuth();
  
  // Obtener lista de negocios solo para superusuarios
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
    enabled: isSuperuser,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      business_id: user?.business?.id || '',
      llm_model_name: '',
      embedding_model_name: '',
      embedding_dim: '',
      sentiment_model_name: '',
      intent_model_name: '',
      search_top_k: 5,
      search_min_similarity: 0.7,
      generation_temperature: 0.7,
      generation_top_p: 0.9,
      generation_top_k: 50,
      generation_frequency_penalty: 0,
      generation_presence_penalty: 0,
      ...initialData
    },
  });

  React.useEffect(() => {
    // Establecer el business_id del usuario si no es superusuario
    if (!isSuperuser && user?.business?.id) {
      setValue('business_id', user.business.id);
    }

    reset({
      business_id: isSuperuser ? initialData?.business_id || '' : user?.business?.id || '',
      llm_model_name: initialData?.llm_model_name || '',
      embedding_model_name: initialData?.embedding_model_name || '',
      embedding_dim: initialData?.embedding_dim || '',
      sentiment_model_name: initialData?.sentiment_model_name || '',
      intent_model_name: initialData?.intent_model_name || '',
      search_top_k: initialData?.search_top_k || 5,
      search_min_similarity: initialData?.search_min_similarity || 0.7,
      generation_temperature: initialData?.generation_temperature || 0.7,
      generation_top_p: initialData?.generation_top_p || 0.9,
      generation_top_k: initialData?.generation_top_k || 50,
      generation_frequency_penalty: initialData?.generation_frequency_penalty || 0,
      generation_presence_penalty: initialData?.generation_presence_penalty || 0,
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

        {/* Modelo LLM */}
        <div>
          <label htmlFor="llm_model_name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Modelo LLM *
          </label>
          <input
            type="text"
            id="llm_model_name"
            {...register('llm_model_name', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.llm_model_name 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: gpt-4"
          />
          {errors.llm_model_name && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.llm_model_name.message}
            </p>
          )}
        </div>

        {/* Modelo de Embedding */}
        <div>
          <label htmlFor="embedding_model_name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Modelo de Embedding *
          </label>
          <input
            type="text"
            id="embedding_model_name"
            {...register('embedding_model_name', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.embedding_model_name 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: text-embedding-ada-002"
          />
          {errors.embedding_model_name && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.embedding_model_name.message}
            </p>
          )}
        </div>

        {/* Modelo de Sentimiento */}
        <div>
          <label htmlFor="sentiment_model_name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Modelo de Sentimiento
          </label>
          <input
            type="text"
            id="sentiment_model_name"
            {...register('sentiment_model_name')}
            className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50 shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400"
            placeholder="Opcional"
          />
        </div>

        {/* Modelo de Intención */}
        <div>
          <label htmlFor="intent_model_name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Modelo de Intención
          </label>
          <input
            type="text"
            id="intent_model_name"
            {...register('intent_model_name')}
            className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50 shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400"
            placeholder="Opcional"
          />
        </div>


        {/* Dimensión del embedding */}
        {/* Modelo de Embedding */}
        <div>
          <label htmlFor="embedding_dim" className="block text-sm font-roboto font-medium text-primary mb-1">
            Dimensión del embedding *
          </label>
          <input
            type="text"
            id="embedding_dim"
            {...register('embedding_dim', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.embedding_dim 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: 1024"
          />
          {errors.embedding_dim && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.embedding_dim.message}
            </p>
          )}
        </div>


        {/* Top K para búsqueda */}
        <div>
          <label htmlFor="search_top_k" className="block text-sm font-roboto font-medium text-primary mb-1">
            Top K para búsqueda *
          </label>
          <input
            type="number"
            id="search_top_k"
            {...register('search_top_k', { 
              required: 'Este campo es requerido',
              min: { value: 1, message: 'El valor mínimo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.search_top_k 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.search_top_k && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.search_top_k.message}
            </p>
          )}
        </div>

        {/* Similitud mínima para búsqueda */}
        <div>
          <label htmlFor="search_min_similarity" className="block text-sm font-roboto font-medium text-primary mb-1">
            Similitud mínima para búsqueda *
          </label>
          <input
            type="number"
            step="0.01"
            id="search_min_similarity"
            {...register('search_min_similarity', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 1, message: 'El valor máximo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.search_min_similarity 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.search_min_similarity && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.search_min_similarity.message}
            </p>
          )}
        </div>

        {/* Temperatura para generación */}
        <div>
          <label htmlFor="generation_temperature" className="block text-sm font-roboto font-medium text-primary mb-1">
            Temperatura para generación *
          </label>
          <input
            type="number"
            step="0.1"
            id="generation_temperature"
            {...register('generation_temperature', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.generation_temperature 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.generation_temperature && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.generation_temperature.message}
            </p>
          )}
        </div>

        {/* Top P para generación */}
        <div>
          <label htmlFor="generation_top_p" className="block text-sm font-roboto font-medium text-primary mb-1">
            Top P para generación *
          </label>
          <input
            type="number"
            step="0.1"
            id="generation_top_p"
            {...register('generation_top_p', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 1, message: 'El valor máximo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.generation_top_p 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.generation_top_p && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.generation_top_p.message}
            </p>
          )}
        </div>

        {/* Top K para generación */}
        <div>
          <label htmlFor="generation_top_k" className="block text-sm font-roboto font-medium text-primary mb-1">
            Top K para generación *
          </label>
          <input
            type="number"
            id="generation_top_k"
            {...register('generation_top_k', { 
              required: 'Este campo es requerido',
              min: { value: 1, message: 'El valor mínimo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.generation_top_k 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.generation_top_k && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.generation_top_k.message}
            </p>
          )}
        </div>

        {/* Penalización de frecuencia */}
        <div>
          <label htmlFor="generation_frequency_penalty" className="block text-sm font-roboto font-medium text-primary mb-1">
            Penalización de frecuencia *
          </label>
          <input
            type="number"
            step="0.1"
            id="generation_frequency_penalty"
            {...register('generation_frequency_penalty', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.generation_frequency_penalty 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.generation_frequency_penalty && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.generation_frequency_penalty.message}
            </p>
          )}
        </div>

        {/* Penalización de presencia */}
        <div>
          <label htmlFor="generation_presence_penalty" className="block text-sm font-roboto font-medium text-primary mb-1">
            Penalización de presencia *
          </label>
          <input
            type="number"
            step="0.1"
            id="generation_presence_penalty"
            {...register('generation_presence_penalty', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.generation_presence_penalty 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          />
          {errors.generation_presence_penalty && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.generation_presence_penalty.message}
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

export default BotSettingForm;