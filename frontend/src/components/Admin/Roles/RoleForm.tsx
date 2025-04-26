import React from 'react';
import { useForm } from 'react-hook-form';
import { Role } from '../../../types/role';

interface RoleFormProps {
  initialData?: Role | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const RoleForm = ({ initialData, onSubmit, isSubmitting }: RoleFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      is_active: true,
      ...initialData
    },
  });

  React.useEffect(() => {
    reset({
      name: '',
      description: '',
      permissions: [],
      is_active: true,
      ...initialData
    });
  }, [initialData, reset]);

  // Lista de permisos disponibles (ajustar según tu sistema)
  const availablePermissions = [
    'business.view',
    'business.edit',
    'users.view',
    'users.edit',
    'roles.view',
    'roles.edit'
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </h2>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-roboto font-medium text-primary mb-1">
          Nombre del Rol *
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
          placeholder="Ej: Administrador"
        />
        {errors.name && (
          <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-roboto font-medium text-primary mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border shadow-sm 
                    hover:border-gray-400 focus:border-primary-light focus:ring-2 focus:ring-primary-light/50 
                    focus:outline-none transition-colors duration-200 placeholder:text-gray-400"
          placeholder="Describa el propósito del rol..."
        />
      </div>

      <div>
        <label className="block text-sm font-roboto font-medium text-primary mb-2">
          Permisos
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availablePermissions.map((permission) => (
            <div key={permission} className="flex items-center">
              <input
                type="checkbox"
                id={`perm-${permission}`}
                value={permission}
                {...register('permissions')}
                className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary-light"
              />
              <label htmlFor={`perm-${permission}`} className="ml-2 block text-sm text-gray-700">
                {permission}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary-light"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm font-roboto text-secondary">
          Rol activo
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
          ) : initialData ? 'Actualizar Rol' : 'Crear Rol'}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;