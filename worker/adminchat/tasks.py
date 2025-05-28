# tasks.py
from celery import shared_task
from .services.embedding_service import EmbeddingGenerator
from .models import Embedding, Business, Document, ProductServiceItem
from django.db import transaction
import logging
import json
from django.utils import timezone

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


@shared_task(bind=True, max_retries=3, retry_backoff=True, retry_jitter=True)
def create_embeddings_task(self, business_id, source_type, source_id):
    """
    Complete embedding generation task with proper Celery state management
    """
    
    def update_progress(stage, details=None):
        """Helper to update task progress without conflicts"""
        progress_data = {
            'stage': stage,
            'business_id': str(business_id),
            'source_type': source_type,
            'source_id': str(source_id),
            'task_id': str(self.request.id),
            'retry_count': self.request.retries,
            'timestamp': timezone.now().isoformat()
        }
        if details:
            progress_data.update(details)
        
        # Use PROGRESS state for intermediate updates
        self.update_state(state='PROGRESS', meta=progress_data)

    try:
        # ===== 1. VALIDATE BUSINESS =====
        update_progress('validating_business')
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist as e:
            logger.error(f"Business not found: {business_id}")
            raise ValueError(f"Business not found: {business_id}") from e

        # ===== 2. GET BOT CONFIGURATION =====
        update_progress('loading_bot_configuration')
        try:
            bot_settings = BotSettingsService.get_bot_settings(str(business_id))
            if not bot_settings or 'embedding_model_name' not in bot_settings:
                logger.error(f"Incomplete bot configuration for business {business_id}")
                raise ValueError("Bot settings incomplete: missing embedding_model_name")
                
            embedding_model = bot_settings['embedding_model_name']
            update_progress('bot_configuration_loaded', {'embedding_model': embedding_model})
        except Exception as e:
            logger.error(f"Bot config error for business {business_id}: {str(e)}")
            raise ValueError(f"Bot configuration error: {str(e)}") from e

        # ===== 3. GET CHUNKING SETTINGS =====
        update_progress('loading_chunking_settings')
        try:
            chunking_settings = ChunkingService.get_chunking_settings(str(business_id), source_type)
            if not chunking_settings:
                logger.error(f"No chunking settings for business {business_id}, source_type {source_type}")
                raise ValueError(f"No chunking settings found for {source_type}")
            
            update_progress('chunking_settings_loaded', {
                'chunk_size': chunking_settings['chunk_size'],
                'chunk_overlap': chunking_settings['chunk_overlap']
            })
        except Exception as e:
            logger.error(f"Chunking config error: {str(e)}")
            raise ValueError(f"Chunking configuration error: {str(e)}") from e

        # ===== 4. PROCESS CONTENT =====
        update_progress('processing_content')
        try:
            if source_type == 'document':
                text = process_document(business_id, source_id)
            elif source_type == 'product':
                text = process_product(business_id, source_id)
            else:
                logger.error(f"Unsupported source type: {source_type}")
                raise ValueError(f"Unsupported source type: {source_type}")
            
            update_progress('content_processed', {'text_length': len(text)})
        except Exception as e:
            logger.error(f"Content processing failed: {str(e)}")
            raise ValueError(f"Content processing failed: {str(e)}") from e

        # ===== 5. CLEAN AND CHUNK TEXT =====
        update_progress('cleaning_and_chunking')
        cleaned_text = TextCleaner.clean_text(text)
        chunks = ChunkGenerator.generate_chunks(
            cleaned_text,
            chunk_size=chunking_settings['chunk_size'],
            chunk_overlap=chunking_settings['chunk_overlap']
        )
        
        update_progress('text_chunked', {'chunks_count': len(chunks)})

        # ===== 6. GENERATE EMBEDDINGS =====
        update_progress('generating_embeddings')
        logger.info(f"Starting embedding generation for {source_type}:{source_id}")
        logger.info(f"Generating embeddings with model {embedding_model}")
        try:
            embeddings = EmbeddingGenerator.generate_embeddings(
                chunks,
                embedding_model=embedding_model  # Cambiar de 'model_name' a 'embedding_model'
            )


            update_progress('embeddings_generated', {'embeddings_count': len(embeddings)})
        except Exception as e:
            logger.error(f"Embedding generation failed with model {embedding_model}: {str(e)}")
            raise RuntimeError(f"Embedding generation failed: {str(e)}") from e

        # ===== 7. SAVE TO DATABASE =====
        update_progress('saving_to_database')
        try:
            with transaction.atomic():
                embedding_objects = []
                for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                    metadata = {
                        'source_type': source_type,
                        'source_id': str(source_id),
                        'chunk_index': i,
                        'model_used': embedding_model,
                        'processing_time': timezone.now().isoformat()
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

                # Successful response
                return {
                    'status': 'completed',
                    'embeddings_created': len(embedding_objects),
                    'business_id': str(business_id),
                    'source_type': source_type,
                    'source_id': str(source_id),
                    'task_id': str(self.request.id),
                    'monitor_url': f'/api/tasks/{self.request.id}/status/',
                    'embedding_model': embedding_model,
                    'chunk_size': chunking_settings['chunk_size'],
                    'chunk_overlap': chunking_settings['chunk_overlap'],
                    'processing_time': timezone.now().isoformat(),
                    'retry_count': self.request.retries
                }

        except Exception as e:
            logger.error(f"Failed to save embeddings: {str(e)}")
            raise RuntimeError(f"Failed to save embeddings: {str(e)}") from e

    except Exception as e:
        # Log the error for debugging
        error_msg = f"Task failed for business {business_id}, source {source_type}:{source_id} - {str(e)}"
        logger.error(error_msg)
        
        # If we haven't reached max retries, let Celery handle the retry
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying task {self.request.id} (attempt {self.request.retries + 1}/{self.max_retries})")
            # Raise the exception to trigger Celery's retry mechanism
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
        # Final failure - return structured error info
        logger.error(f"Task failed permanently after {self.max_retries} retries: {error_msg}")
        return {
            'status': 'failed',
            'error': {
                'type': e.__class__.__name__,
                'message': str(e),
                'timestamp': timezone.now().isoformat()
            },
            'task': {
                'business_id': str(business_id),
                'source_type': source_type,
                'source_id': str(source_id),
                'task_id': str(self.request.id),
                'retry_count': self.request.retries,
                'max_retries': self.max_retries
            }
        }