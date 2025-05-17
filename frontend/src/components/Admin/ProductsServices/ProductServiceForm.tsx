import React from 'react';
import { useForm } from 'react-hook-form';
import { ProductService } from '../../../types/productService';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBusinesses } from '../../../api/admin/business';
import { Business } from '../../../types/business';

interface ProductServiceFormProps {
  initialData?: ProductService | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const ProductServiceForm = ({ initialData, onSubmit, isSubmitting }: ProductServiceFormProps) => {
  const { user, isSuperuser } = useAuth();
  
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
    enabled: isSuperuser,
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset, 
    setValue, 
    watch 
  } = useForm({
    defaultValues: {
      business_id: initialData?.business?.id || user?.business?.id || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      price: initialData?.price || '0.00',
      custom_metadata: initialData?.custom_metadata ? JSON.stringify(initialData.custom_metadata, null, 2) : ''
    },
  });

  const selectedBusinessId = watch('business_id');

  React.useEffect(() => {
    if (!isSuperuser && user?.business?.id) {
      setValue('business_id', user.business.id);
    }
  }, [isSuperuser, user, setValue]);

  const validateJSON = (value: string) => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return "El JSON no es válido";
    }
  };

  const handleFormSubmit = (data: any) => {
    const formData = {
      ...data,
      business_id: data.business_id,
      custom_metadata: data.custom_metadata ? JSON.parse(data.custom_metadata) : undefined
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Producto/Servicio' : 'Crear Nuevo Producto/Servicio'}
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
                value={selectedBusinessId}
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

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Nombre *
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
            placeholder="Ej: Producto Premium"
          />
          {errors.name && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="category" className="block text-sm font-roboto font-medium text-primary mb-1">
            Categoría *
          </label>
          <input
            type="text"
            id="category"
            {...register('category', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.category 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: Electrónicos"
          />
          {errors.category && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Precio */}
        <div>
          <label htmlFor="price" className="block text-sm font-roboto font-medium text-primary mb-1">
            Precio *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            id="price"
            {...register('price', { 
              required: 'Este campo es requerido',
              min: { value: 0, message: 'El precio mínimo es 0' },
              valueAsNumber: true
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.price 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: 99.99"
          />
          {errors.price && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.price.message}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-roboto font-medium text-primary mb-1">
            Descripción *
          </label>
          <textarea
            id="description"
            {...register('description', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.description 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            rows={3}
            placeholder="Descripción detallada del producto o servicio"
          />
          {errors.description && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Metadata personalizada */}
        <div className="md:col-span-2">
          <label htmlFor="custom_metadata" className="block text-sm font-roboto font-medium text-primary mb-1">
            Metadata Personalizada (JSON)
          </label>
          <textarea
            id="custom_metadata"
            {...register('custom_metadata', { validate: validateJSON })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.custom_metadata 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder='Ej: {"garantia": "1 año", "color": "negro"}'
            rows={3}
          />
          {errors.custom_metadata && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.custom_metadata.message || "El JSON no es válido"}
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
          ) : initialData ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};

export default ProductServiceForm;