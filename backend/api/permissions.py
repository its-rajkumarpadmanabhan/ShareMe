from rest_framework import permissions

class IsOwnerOrCollaboratorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners or collaborators of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner or collaborators.
        return obj.uploaded_by == request.user or (request.user in obj.collaborators.all())
