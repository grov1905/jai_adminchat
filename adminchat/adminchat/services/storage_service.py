import boto3
import hashlib
import os
from django.conf import settings
from urllib.parse import urljoin

class S3StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET
        self.base_path = 'documents/'
    
    def calculate_file_hash(self, file):
        """Calcula el hash SHA-256 de un archivo"""
        file.seek(0)
        hash_sha256 = hashlib.sha256()
        for chunk in file.chunks():
            hash_sha256.update(chunk)
        file.seek(0)
        return hash_sha256.hexdigest()
    
    def upload_file(self, file, file_name, business_id):
        """Sube un archivo a S3 y devuelve la ruta"""
        # Generar ruta única: documents/<business_id>/<hash>/<filename>
        file_hash = self.calculate_file_hash(file)
        s3_path = f"{self.base_path}{business_id}/{file_hash}/{file_name}"
        
        self.s3_client.upload_fileobj(
            file,
            self.bucket_name,
            s3_path,
            ExtraArgs={
                'ContentType': file.content_type,
                'Metadata': {
                    'business_id': str(business_id),
                    'original_filename': file_name
                }
            }
        )
        
        # Construir URL completa
        s3_url = f"s3://{self.bucket_name}/{s3_path}"
        return s3_url, file_hash
    
    def get_file_url(self, s3_path):
        """Genera una URL firmada para descargar el archivo"""
        if not s3_path.startswith('s3://'):
            return None
        
        # Extraer bucket y key del path s3://
        bucket_key = s3_path[5:]  # Remueve 's3://'
        bucket, key = bucket_key.split('/', 1)
        
        return self.s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=3600  # URL válida por 1 hora
        )

    def delete_file(self, s3_path):
        """
        Elimina un archivo de S3
        :param s3_path: Ruta completa del archivo en S3 (ej: s3://bucket/path/file.txt)
        :return: True si fue eliminado, False si no existía
        """
        if not s3_path.startswith('s3://'):
            raise ValueError("Invalid S3 path format")

        # Extraer bucket y key del path
        path_parts = s3_path[5:].split('/', 1)  # Remueve 's3://'
        bucket_name = path_parts[0]
        object_key = path_parts[1] if len(path_parts) > 1 else ''

        try:
            self.s3_client.delete_object(Bucket=bucket_name, Key=object_key)
            return True
        except self.s3_client.exceptions.NoSuchKey:
            return False
        except Exception as e:
            raise Exception(f"Failed to delete file from S3: {str(e)}")