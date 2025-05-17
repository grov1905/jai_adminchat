import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, deleteDocument, getDocumentsByBusiness } from '../../../api/admin/documents';
import DocumentsList from '../../../components/Admin/Documents/DocumentsList';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Document, DocumentsResponse } from '../../../types/document';

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { user, isSuperuser } = useAuth();
  
  const { data, isLoading, error } = useQuery<DocumentsResponse | Document[]>({
    queryKey: ['documents', page],
    queryFn: async () => {
      if (isSuperuser) {
        const response = await getDocuments(page);
        // Validación cuando no hay documentos
        if (Array.isArray(response) && response.length === 0) {
          return { results: [], count: 0, next: null, previous: null, total_pages: 0 };
        }
        return response;
      } else if (user?.business?.id) {
        const response = await getDocumentsByBusiness(user.business.id, page);
        // Validación cuando no hay documentos
        if (Array.isArray(response) && response.length === 0) {
          return { results: [], count: 0, next: null, previous: null, total_pages: 0 };
        }
        return response;
      }
      return { results: [], count: 0, next: null, previous: null, total_pages: 0 };
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando documentos...</div>;
  if (error) return <div>Error al cargar documentos</div>;

  // Manejo seguro de los datos cuando no hay documentos
  const documentsList = (() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.results || [];
  })();

  const totalPages = (() => {
    if (!data || Array.isArray(data)) return 1;
    return Math.ceil((data.count || 0) / 10);
  })();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Documentos</h1>
        <Link
          to="/admin/documents/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light"
        >
          Subir Documento
        </Link>
      </div>
      
      {/* Mostrar mensaje cuando no hay documentos */}
      {documentsList.length === 0 ? (
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">No se encontraron documentos.</p>

        </div>
      ) : (
        <DocumentsList 
          documents={documentsList}
          onDelete={handleDelete}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default DocumentsPage;