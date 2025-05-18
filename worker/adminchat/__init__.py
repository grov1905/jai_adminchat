default_app_config = 'adminchat.apps.AdminchatConfig'

from .celery import app as celery_app
__all__ = ('celery_app',)


