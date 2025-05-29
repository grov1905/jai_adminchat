// frontend/src/components/Admin/Documents/VectorizationModal.tsx
import React, { useEffect, useState } from 'react';
import { getTaskStatus } from '../../../api/admin/embeddings';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface VectorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  documentName: string;
}

const VectorizationModal: React.FC<VectorizationModalProps> = ({
  isOpen,
  onClose,
  taskId,
  documentName
}) => {
  const [status, setStatus] = useState<{
    ready: boolean;
    successful: boolean;
    result: any;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !taskId) return;

    const checkStatus = async () => {
      try {
        const statusData = await getTaskStatus(taskId);
        setStatus(statusData);
        setIsLoading(false);

        // Si la tarea no está lista, seguir consultando cada 2 segundos
        if (!statusData.ready) {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking task status:', error);
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [isOpen, taskId]);

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    
    switch (status.status) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAILURE':
        return 'text-red-600';
      case 'RETRY':
        return 'text-yellow-600';
      case 'PENDING':
      case 'STARTED':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    if (!status) return 'Cargando...';
    
    switch (status.status) {
      case 'SUCCESS':
        return 'Vectorización completada exitosamente';
      case 'FAILURE':
        return 'Error en la vectorización';
      case 'RETRY':
        return 'Reintentando vectorización...';
      case 'PENDING':
        return 'Vectorización en cola...';
      case 'STARTED':
        return 'Vectorización en progreso...';
      default:
        return `Estado: ${status.status}`;
    }
  };

  const getStatusIcon = () => {
    if (!status) {
      return (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      );
    }

    switch (status.status) {
      case 'SUCCESS':
        return (
          <div className="rounded-full h-8 w-8 bg-green-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'FAILURE':
        return (
          <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'RETRY':
      case 'PENDING':
      case 'STARTED':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        );
      default:
        return (
          <div className="rounded-full h-8 w-8 bg-gray-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Estado de Vectorización
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              {getStatusIcon()}
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {documentName}
            </h4>
            
            <p className={`text-sm font-medium mb-4 ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            
            {status && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Task ID: {taskId}</p>
                <p>Ready: {status.ready ? 'Sí' : 'No'}</p>
                <p>Successful: {status.successful ? 'Sí' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={status ? !status.ready : false}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              status && !status.ready
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {status && status.ready ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VectorizationModal;