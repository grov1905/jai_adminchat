import React from 'react';
import { useForm } from 'react-hook-form';
import { ApiRoute } from '../../../types/apiRoute';

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface ApiRouteFormProps {
  initialData?: ApiRoute | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  externalApiConfigs: { id: number; name: string }[];
}

const ApiRouteForm = ({ initialData, onSubmit, isSubmitting, externalApiConfigs }: ApiRouteFormProps) => {
  const defaultValues = {
    path: '',
    external_path: '',
    method: 'GET',
    requires_auth: true,
    request_transformation: '{}',
    response_transformation: '{}',
    is_active: true,
    config: '',
    ...(initialData ? {
      ...initialData,
      request_transformation: initialData.request_transformation 
        ? JSON.stringify(initialData.request_transformation, null, 2)
        : '{}',
      response_transformation: initialData.response_transformation
        ? JSON.stringify(initialData.response_transformation, null, 2)
        : '{}'
    } : {})
  };

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [initialData, reset]);

  const requestTransformation = watch('request_transformation');
  const responseTransformation = watch('response_transformation');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Ruta API' : 'Crear Nueva Ruta API'}
        </h2>
      </div>

      <div>
        <label htmlFor="config" className="block text-sm font-roboto font-medium text-primary mb-1">
          Configuración API *
        </label>
        <select
          id="config"
          {...register('config', { required: 'Este campo es requerido', valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.config 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          disabled={!!initialData}
        >
          <option value="">Seleccione una configuración</option>
          {externalApiConfigs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name}
            </option>
          ))}
        </select>
        {errors.config && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.config.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="path" className="block text-sm font-roboto font-medium text-primary mb-1">
          Ruta Local *
        </label>
        <input
          type="text"
          id="path"
          {...register('path', { required: 'Este campo es requerido' })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.path 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          placeholder="/api/pagos"
        />
        {errors.path && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.path.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="external_path" className="block text-sm font-roboto font-medium text-primary mb-1">
          Ruta Externa *
        </label>
        <input
          type="text"
          id="external_path"
          {...register('external_path', { required: 'Este campo es requerido' })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.external_path 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          placeholder="/v1/payments"
        />
        {errors.external_path && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.external_path.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="method" className="block text-sm font-roboto font-medium text-primary mb-1">
          Método HTTP *
        </label>
        <select
          id="method"
          {...register('method', { required: true })}
          className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border shadow-sm hover:border-gray-400 focus:border-primary-light focus:ring-2 focus:ring-primary-light/50 focus:outline-none transition-colors duration-200"
        >
          {methods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="requires_auth"
          {...register('requires_auth')}
          className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary-light"
        />
        <label htmlFor="requires_auth" className="ml-2 block text-sm font-roboto text-secondary">
          Requiere autenticación
        </label>
      </div>

      <div>
        <label htmlFor="request_transformation" className="block text-sm font-roboto font-medium text-primary mb-1">
          Transformación de Request (JSON)
        </label>
        <textarea
          id="request_transformation"
          rows={6}
          {...register('request_transformation', {
            validate: (value) => {
              try {
                JSON.parse(value);
                return true;
              } catch (e) {
                return 'JSON inválido';
              }
            }
          })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.request_transformation 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 font-mono text-sm`}
        />
        {errors.request_transformation && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.request_transformation.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="response_transformation" className="block text-sm font-roboto font-medium text-primary mb-1">
          Transformación de Response (JSON)
        </label>
        <textarea
          id="response_transformation"
          rows={6}
          {...register('response_transformation', {
            validate: (value) => {
              try {
                JSON.parse(value);
                return true;
              } catch (e) {
                return 'JSON inválido';
              }
            }
          })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.response_transformation 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 font-mono text-sm`}
        />
        {errors.response_transformation && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.response_transformation.message}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary-light"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm font-roboto text-secondary">
          Ruta activa
        </label>
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

export default ApiRouteForm;