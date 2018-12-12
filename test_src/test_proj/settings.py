# [test_settings]
from vstutils.settings import *

INSTALLED_APPS += [
    'test_proj',
]

API[VST_API_VERSION][r'hosts'] = dict(
    view='test_proj.views.HostGroupViewSet'
)
API[VST_API_VERSION][r'deephosts'] = dict(
    view='test_proj.views.DeepHostGroupViewSet'
)
# ![test_settings]

API[VST_API_VERSION][r'subhosts'] = dict(
    view='test_proj.views.HostViewSet'
)

API[VST_API_VERSION][r'files'] = dict(
    view='test_proj.views.FilesViewSet'
)

DEBUG = True
