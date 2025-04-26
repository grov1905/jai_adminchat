import React from 'react';
import { useForm } from 'react-hook-form';
import { Business } from '../../../api/admin/business';

interface BusinessFormProps {
  initialData?: Business | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const BusinessForm = ({ initialData, onSubmit, isSubmitting }: BusinessFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      ...initialData
    },
  });

  React.useEffect(() => {
    reset({
      name: '',
      description: '',
      is_active: true,
      ...initialData
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      {/* Encabezado */}
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Negocio' : 'Crear Nuevo Negocio'}
        </h2>
      </div>

      {/* Campo Nombre - Versión Mejorada */}
      <div>
        <label htmlFor="name" className="block text-sm font-roboto font-medium text-primary mb-1">
          Nombre del Negocio *
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'Este campo es requerido' })}
          className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
            errors.name 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
          } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
          placeholder="Ej: Restaurante La Casona"
        />
        {errors.name && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Campo Descripción - Versión Mejorada */}
      <div>
        <label htmlFor="description" className="block text-sm font-roboto font-medium text-primary mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border shadow-sm 
                    hover:border-gray-400 focus:border-primary-light focus:ring-2 focus:ring-primary-light/50 
                    focus:outline-none transition-colors duration-200 placeholder:text-gray-400"
          placeholder="Describa las características del negocio..."
        />
      </div>

      {/* Checkbox Activo */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary-light"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm font-roboto text-secondary">
          Negocio activo
        </label>
      </div>

      {/* Botones */}
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

export default BusinessForm;