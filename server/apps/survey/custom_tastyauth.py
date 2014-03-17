from tastypie.authorization import Authorization
from tastypie.exceptions import Unauthorized


# Thanks, TastyPie docs!
class UserObjectsOnlyAuthorization(Authorization):
    def read_list(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return object_list
        # This assumes a ``QuerySet`` from ``ModelResource``.
        return object_list.filter(surveyor=bundle.request.user)

    def read_detail(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return True
        # Is the requested object owned by the user?
        return bundle.obj.surveyor == bundle.request.user

    def create_list(self, object_list, bundle):
        # Assuming they're auto-assigned to ``user``.
        if bundle.request.user.is_staff:
            return object_list
        return object_list

    def create_detail(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return True
        return bundle.obj.surveyor == bundle.request.user

    def update_list(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return object_list
        allowed = []

        # Since they may not all be saved, iterate over them.
        for obj in object_list:
            if obj.surveyor == bundle.request.user:
                allowed.append(obj)

        return allowed

    def update_detail(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return True
        return bundle.obj.surveyor == bundle.request.user

    def delete_list(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return object_list
        allowed = []

        # Since they may not all be saved, iterate over them.
        for obj in object_list:
            if obj.surveyor == bundle.request.user:
                allowed.append(obj)

        return allowed

    def delete_detail(self, object_list, bundle):
        if bundle.request.user.is_staff:
            return True
        return bundle.obj.surveyor == bundle.request.user
