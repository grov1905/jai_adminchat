import React from 'react';
import { useForm } from 'react-hook-form';
import { BotTemplate, BotTemplateType } from '../../../types/botTemplates';

interface BotTemplateFormProps {
  initialData?: BotTemplate | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const templateTypes: {value: BotTemplateType; label: string}[] = [
  { value: 'greeting', label: 'Saludo' },
  { value: 'farewell', label: 'Despedida' },
  { value: 'sales', label: 'Venta' },
  { value: 'support', label: 'Soporte' },
  { value: 'other', label: 'Otro' },
];

const BotTemplateForm = ({ initialData, onSubmit, isSubmitting }: BotTemplateFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      business_id: '',
      name: '',
      type: 'greeting' as BotTemplateType,
      prompt_template: '',
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...initialData
    },
  });

  React.useEffect(() => {
    reset({
      business_id: '',
      name: '',
      type: 'greeting',
      prompt_template: '',
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...initialData
    });
  }, [initialData, reset]);

  const currentType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            placeholder="Ej: Saludo inicial"
          />
          {errors.name && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-roboto font-medium text-primary mb-1">
            Tipo *
          </label>
          <select
            id="type"
            {...register('type', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.type 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          >
            {templateTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.type.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="prompt_template" className="block text-sm font-roboto font-medium text-primary mb-1">
            Plantilla de Prompt *
          </label>
          <textarea
            id="prompt_template"
            rows={6}
            {...register('prompt_template', { required: 'Este campo es requerido' })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.prompt_template 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder={`Ej: ${currentType === 'greeting' ? 'Hola, bienvenido a nuestro negocio. ¿En qué puedo ayudarte hoy?' : 'Gracias por contactarnos. ¡Que tengas un buen día!'}`}
          />
          {errors.prompt_template && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.prompt_template.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="temperature" className="block text-sm font-roboto font-medium text-primary mb-1">
            Temperatura
          </label>
          <input
            type="number"
            step="0.1"
            id="temperature"
            {...register('temperature', { 
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.temperature 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.temperature && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.temperature.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="top_p" className="block text-sm font-roboto font-medium text-primary mb-1">
            Top P
          </label>
          <input
            type="number"
            step="0.1"
            id="top_p"
            {...register('top_p', { 
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 1, message: 'El valor máximo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.top_p 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.top_p && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.top_p.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="top_k" className="block text-sm font-roboto font-medium text-primary mb-1">
            Top K
          </label>
          <input
            type="number"
            id="top_k"
            {...register('top_k', { 
              min: { value: 1, message: 'El valor mínimo es 1' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.top_k 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.top_k && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.top_k.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="frequency_penalty" className="block text-sm font-roboto font-medium text-primary mb-1">
            Penalización de frecuencia
          </label>
          <input
            type="number"
            step="0.1"
            id="frequency_penalty"
            {...register('frequency_penalty', { 
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.frequency_penalty 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.frequency_penalty && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.frequency_penalty.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="presence_penalty" className="block text-sm font-roboto font-medium text-primary mb-1">
            Penalización de presencia
          </label>
          <input
            type="number"
            step="0.1"
            id="presence_penalty"
            {...register('presence_penalty', { 
              min: { value: 0, message: 'El valor mínimo es 0' },
              max: { value: 2, message: 'El valor máximo es 2' }
            })}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.presence_penalty 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          />
          {errors.presence_penalty && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.presence_penalty.message}
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

export default BotTemplateForm;