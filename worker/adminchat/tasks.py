from celery import shared_task
from .services.embedding_service import EmbeddingGenerator
from .models import Embedding, Business, Document, ProductServiceItem
from django.db import transaction
import logging
from .services.embedding_service import (
    TextExtractor, TextCleaner, ChunkGenerator, 
    S3FileService, EmbeddingGenerator
)
from .services.chunking_service import ChunkingService
from .services.bot_setting_service import BotSettingsService
from rest_framework import serializers

logger = logging.getLogger(__name__)

# Funciones helper como funciones independientes (no métodos)
def process_document(business_id, document_id):
    """Procesa un documento para extraer su texto"""
    document = Document.objects.get(id=document_id, business_id=business_id)
    s3_service = S3FileService()
    
    try:
        file_content = s3_service.get_file_content(document.file_path)
        
        if document.type == 'pdf':
            return TextExtractor.extract_from_pdf(file_content)
        elif document.type == 'docx':
            return TextExtractor.extract_from_docx(file_content)
        elif document.type == 'txt':
            return TextExtractor.extract_from_txt(file_content)
        elif document.type == 'xlsx':
            return TextExtractor.extract_from_xlsx(file_content)
        elif document.type == 'csv':
            return TextExtractor.extract_from_csv(file_content)
        else:
            raise ValueError(f"Unsupported document type: {document.type}")
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        raise serializers.ValidationError({
            'source_id': f'Could not process document: {str(e)}'
        })

def process_product(business_id, product_id):
    """Procesa un producto para generar su texto"""
    product = ProductServiceItem.objects.get(id=product_id, business_id=business_id)
    
    text_parts = []
    if product.name:
        text_parts.append(f"Name: {product.name}")
    if product.description:
        text_parts.append(f"Description: {product.description}")
    if product.category:
        text_parts.append(f"Category: {product.category}")
    if product.price:
        text_parts.append(f"Price: {product.price}")
    
    return "\n".join(text_parts)

@shared_task(bind=True, max_retries=3)
def create_embeddings_task(self, business_id, source_type, source_id):
    try:
        # Obtener datos necesarios
        business = Business.objects.get(id=business_id)
        
        # Obtener configuraciones
        chunking_settings = ChunkingService.get_chunking_settings(business_id, source_type)
        bot_settings = BotSettingsService.get_bot_settings(business_id)
        embedding_model = bot_settings['embedding_model_name']

        # Procesar el contenido según el tipo
        if source_type == 'document':
            text = process_document(business_id, source_id)  # Llamada directa a la función
        elif source_type == 'product':
            text = process_product(business_id, source_id)  # Llamada directa a la función
        
        cleaned_text = TextCleaner.clean_text(text)
        chunks = ChunkGenerator.generate_chunks(cleaned_text, 
                                             chunking_settings['chunk_size'],
                                             chunking_settings['chunk_overlap'])
        
        print('inicio embedding')
        embeddings = EmbeddingGenerator.generate_embeddings(
            chunks,
            bot_settings['embedding_model_name'],
            bot_settings['embedding_dim']
        )
        print('embedding finalizo')
        
        # Crear los embeddings en la base de datos
        with transaction.atomic():
            embedding_objects = []
            for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                metadata = {
                    'source_type': source_type,
                    'source_id': str(source_id),
                    'chunk_index': i,
                    'model_used': embedding_model
                }
            
                if source_type == 'document':
                    doc = Document.objects.get(id=source_id)
                    metadata.update({
                        'document_name': doc.name,
                        'document_type': doc.type
                    })
                elif source_type == 'product':
                    product = ProductServiceItem.objects.get(id=source_id)
                    metadata.update({
                        'product_name': product.name,
                        'product_category': product.category
                    })
            
                embedding_objects.append(Embedding(
                    business=business,
                    vector=vector,
                    content=chunk,
                    source_type=source_type,
                    source_id=source_id,
                    chunk_index=i,
                    metadata=metadata
                ))

            Embedding.objects.bulk_create(embedding_objects)
            
        return {"status": "completed", "embeddings_created": len(embedding_objects)}
    
    except Exception as e:
        logger.error(f"Error in embeddings task: {str(e)}")
        self.retry(exc=e, countdown=60 * self.request.retries)