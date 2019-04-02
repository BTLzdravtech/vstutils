from __future__ import unicode_literals
import logging
import traceback
from django.contrib.auth import get_user_model
from django.conf import settings
try:
    from .ldap_utils import LDAP as _LDAP
    HAS_LDAP = True
except ImportError:
    _LDAP = object
    HAS_LDAP = False

UserModel = get_user_model()
logger = logging.getLogger(settings.VST_PROJECT_LIB)


class LDAP(_LDAP):
    '''
    LDAP class wrapper
    '''


class LdapBackend(object):
    @property
    def domain(self):
        return settings.LDAP_DOMAIN

    @property
    def server(self):
        return settings.LDAP_SERVER

    def authenticate(self, request, username=None, password=None):
        # pylint: disable=protected-access,unused-argument
        try:
            backend = LDAP(self.server, username, password, self.domain)
            user = UserModel._default_manager.get_by_natural_key(backend.domain_user)
            return user if self.user_can_authenticate(user) else None
        except Exception:
            logger.info(traceback.format_exc())
            return

    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        that attribute are allowed.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None

    def get_user(self, user_id):
        # pylint: disable=protected-access
        try:
            user = UserModel._default_manager.get(pk=user_id)
        except UserModel.DoesNotExist:  # nocv
            return None
        return user if self.user_can_authenticate(user) else None
