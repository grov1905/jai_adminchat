# business/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Solo usuarios con is_superuser=True pueden acceder"""
    def has_permission(self, request, view):
        return request.user.is_superuser

class IsBusinessAdmin(permissions.BasePermission):
    """Usuarios con rol 'admin' en su negocio pueden acceder"""
    def has_permission(self, request, view):
        return request.user.role and request.user.role.name.lower() == 'admin'

class IsSameBusinessUser(permissions.BasePermission):
    """El usuario solo puede acceder a su propia información"""
    def has_object_permission(self, request, view, obj):
        return obj == request.user