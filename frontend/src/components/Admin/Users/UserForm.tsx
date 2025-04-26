// src/components/Admin/Users/UserForm.tsx
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { BusinessUser } from '../../../api/admin/users';
import { Business, getBusinesses } from '../../../api/admin/business';
import { getRoles} from '../../../api/admin/roles';
import { Role } from '../../../types/role';

interface UserFormProps {
  initialData?: BusinessUser | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

interface UserFormData {
  email: string;
  full_name: string;
  password?: string;
  business_id: string;
  role_id: string;
  phone?: string;
  is_active: boolean;
}

const UserForm = ({ initialData, onSubmit, isSubmitting }: UserFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    defaultValues: initialData ? {
      email: initialData.email,
      full_name: initialData.full_name,
      business_id: initialData.business?.id || '',
      role_id: initialData.role.id,
      phone: initialData.phone || '',
      is_active: initialData.is_active
    } : {
      is_active: true
    }
  });

  // Fetch businesses and roles
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(1),
    select: (data) => data.results
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(1),
    select: (data) => data.results
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            {...register('email', { 
              required: 'Este campo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Nombre Completo */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            {...register('full_name', { required: 'Este campo es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
          {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
        </div>

        {/* Rol */}
        <div>
          <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            id="role_id"
            {...register('role_id', { required: 'Este campo es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          >
            <option value="">Seleccione un rol</option>
            {roles?.map((role: Role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.role_id && <p className="mt-1 text-sm text-red-600">{errors.role_id.message}</p>}
        </div>

        {/* Negocio */}
        <div>
          <label htmlFor="business_id" className="block text-sm font-medium text-gray-700">
            Negocio <span className="text-red-500">*</span>
          </label>
          <select
            id="business_id"
            {...register('business_id', { required: 'Este campo es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          >
            <option value="">Seleccione un negocio</option>
            {businesses?.map((business: Business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          {errors.business_id && <p className="mt-1 text-sm text-red-600">{errors.business_id.message}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="text"
            id="phone"
            {...register('phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
        </div>

        {/* Contraseña (solo para creación) */}
        {!initialData && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              {...register('password', { 
                required: 'Este campo es requerido',
                minLength: {
                  value: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres'
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
        )}

        {/* Estado */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Usuario activo
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;