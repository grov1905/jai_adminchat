# adminchat/services/chunking_service.py
from django.core.exceptions import ObjectDoesNotExist
from ..models import ChunkingSettings
import logging

logger = logging.getLogger(__name__)

class ChunkingService:
    DEFAULT_CHUNK_SIZE = 100
    DEFAULT_CHUNK_OVERLAP = 20

    @classmethod
    def get_chunking_settings(cls, business_id, entity_type):
        """
        Obtiene la configuración de chunking directamente desde la base de datos.
        
        Args:
            business_id (UUID): ID del negocio
            entity_type (str): Tipo de entidad (document, product_service_item, etc.)
            
        Returns:
            dict: Configuración de chunking con 'chunk_size' y 'chunk_overlap'
        """
        try:
            settings = ChunkingSettings.objects.get(
                business_id=business_id,
                entity_type=entity_type
            )
            return {
                'chunk_size': settings.chunk_size,
                'chunk_overlap': settings.chunk_overlap,
                'is_default': False
            }
        except ObjectDoesNotExist:
            logger.info(
                f"No se encontró configuración para business_id={business_id}, "
                f"entity_type={entity_type}. Usando valores por defecto."
            )
            return {
                'chunk_size': cls.DEFAULT_CHUNK_SIZE,
                'chunk_overlap': cls.DEFAULT_CHUNK_OVERLAP,
                'is_default': True
            }