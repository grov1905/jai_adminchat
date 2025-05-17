from django.core.exceptions import ObjectDoesNotExist
from ..models import BotSettings
import logging
logger = logging.getLogger(__name__)

class BotSettingsService:
    EMBEDDING_MODEL_NAME='BAAI/bge-small-en-v1.5'
    EMBEDDING_DIM=1024

    @classmethod
    def get_bot_settings(cls,business_id):
        """
        Obtiene la configuración del bot del negocio directamente desde la base de datos.
        
        Args:
            business_id (UUID): ID del negocio
            
        Returns:
            dict: Configuración de chunking con 'embedding_model_name' y 'embedding_dim'
        """
        try:
            bot_settings = BotSettings.objects.get(
                business_id=business_id
            )
            return {
                'embedding_model_name': bot_settings.embedding_model_name,
                'embedding_dim': bot_settings.embedding_dim,
                'is_default': False
            }
        except ObjectDoesNotExist:
            logger.info(
                f"No se encontró configuración para business_id={business_id}, "
            )
            return {
                'chunk_size': cls.EMBEDDING_MODEL_NAME,
                'chunk_overlap': cls.EMBEDDING_DIM,
                'is_default': True
            }