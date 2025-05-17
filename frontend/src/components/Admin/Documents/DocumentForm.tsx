import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Document } from '../../../types/document';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBusinesses } from '../../../api/admin/business';
import { Business } from '../../../types/business';

interface DocumentFormProps {
  initialData?: Document | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const DocumentForm = ({ initialData, onSubmit, isSubmitting }: DocumentFormProps) => {
  const { user, isSuperuser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(initialData?.business || user?.business || null);
  
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
    enabled: isSuperuser,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      business: initialData?.business || user?.business || null,
      name: initialData?.name || '',
      type: initialData?.type || '',
      file: null as File | null,
      custom_metadata: initialData?.custom_metadata ? JSON.stringify(initialData.custom_metadata) : ''
    },
  });

  React.useEffect(() => {
    if (!isSuperuser && user?.business) {
      setSelectedBusiness(user.business);
      setValue('business', user.business);
    }
  }, [isSuperuser, user, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);
      
      // Autocompletar nombre y tipo basado en el archivo
      const fileName = file.name.split('.').slice(0, -1).join('.');
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      setValue('name', fileName);
      
      if (fileExtension === 'pdf') setValue('type', 'pdf');
      else if (fileExtension === 'docx') setValue('type', 'docx');
      else if (fileExtension === 'xlsx') setValue('type', 'xlsx');
      else if (fileExtension === 'txt') setValue('type', 'txt');
      else if (fileExtension === 'csv') setValue('type', 'csv');
    }
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const business = businesses?.results.find((b: Business) => b.id === selectedId) || null;
    setSelectedBusiness(business);
    setValue('business', business);
  };

  const handleFormSubmit = (data: any) => {
    const formData = new FormData();
    
    if (selectedBusiness?.id) {
      formData.append('business_id', selectedBusiness.id);
    }
    
    formData.append('name', data.name);
    formData.append('type', data.type);
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    if (data.custom_metadata) {
      try {
        const metadata = JSON.parse(data.custom_metadata);
        formData.append('custom_metadata', JSON.stringify(metadata));
      } catch (e) {
        console.error('Invalid JSON metadata');
      }
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-light-bg p-6 rounded-lg shadow-sm">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-xl font-roboto font-medium text-primary">
          {initialData ? 'Editar Documento' : 'Subir Nuevo Documento'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Negocio */}
        <div className="md:col-span-2">
          <label htmlFor="business" className="block text-sm font-roboto font-medium text-primary mb-1">
            Negocio {!isSuperuser && '(Asignado)'}
          </label>
          
          {isSuperuser ? (
            <>
              <select
                id="business"
                value={selectedBusiness?.id || ''}
                onChange={handleBusinessChange}
                className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
                  errors.business 
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
              {errors.business && (
                <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
                  {errors.business.message}
                </p>
              )}
            </>
          ) : (
            <div className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-2 border border-gray-300">
              {user?.business?.name || 'No asignado'}
              <input
                type="hidden"
                value={selectedBusiness?.id || ''}
                {...register('business')}
              />
            </div>
          )}
        </div>

        {/* Nombre del Documento */}
        <div>
          <label htmlFor="name" className="block text-sm font-roboto font-medium text-primary mb-1">
            Nombre del Documento *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Este campo es requerido' })}
            readOnly={!!selectedFile}
            className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
              errors.name 
                ? 'border-red-500 focus:ring-red-200' 
                : selectedFile 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400`}
            placeholder="Ej: contrato.pdf"
          />
          {errors.name && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Tipo de Documento */}
        <div>
          <label htmlFor="type" className="block text-sm font-roboto font-medium text-primary mb-1">
            Tipo de Documento *
          </label>
          <select
            id="type"
            {...register('type', { required: 'Este campo es requerido' })}
            disabled={!!selectedFile}
            className={`mt-1 block w-full rounded-md px-3 py-2 border ${
              errors.type 
                ? 'border-red-500 focus:ring-red-200' 
                : selectedFile 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'bg-white border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
            } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
          >
            <option value="">Seleccionar tipo</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word</option>
            <option value="xlsx">Excel</option>
            <option value="txt">Texto</option>
            <option value="csv">CSV</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Archivo (solo para creación) */}
        {!initialData && (
          <div className="md:col-span-2">
            <label htmlFor="file" className="block text-sm font-roboto font-medium text-primary mb-1">
              Archivo *
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf,.docx,.xlsx,.txt,.csv"
              onChange={handleFileChange}
              className={`mt-1 block w-full rounded-md bg-white px-3 py-2 border ${
                errors.file 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50'
              } shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200`}
            />
            {errors.file && (
              <p className="mt-1 text-xs font-roboto text-red-500 animate-fadeIn">
                {errors.file.message}
              </p>
            )}
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-600">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>
        )}

        {/* Metadata personalizada */}
        <div className="md:col-span-2">
          <label htmlFor="custom_metadata" className="block text-sm font-roboto font-medium text-primary mb-1">
            Metadata Personalizada (JSON)
          </label>
          <textarea
            id="custom_metadata"
            {...register('custom_metadata')}
            className="mt-1 block w-full rounded-md bg-white px-3 py-2 border border-gray-border hover:border-gray-400 focus:border-primary-light focus:ring-primary-light/50 shadow-sm focus:ring-2 focus:outline-none transition-colors duration-200 placeholder:text-gray-400"
            placeholder='Ej: {"importante": true, "paginas": 15}'
            rows={3}
          />
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
          ) : initialData ? 'Actualizar' : 'Subir Documento'}
        </button>
      </div>
    </form>
  );
};

export default DocumentForm;