from vstutils.environment import prepare_environment, cmd_execution

__version__ = '1.0.0'

settings = {
    "VST_PROJECT": 'test_proj',
    "VST_ROOT_URLCONF": 'vstutils.urls',
    "VST_WSGI": 'vstutils.wsgi',
    "VST_PROJECT_GUI_NAME": "Example Project",
    "DJANGO_SETTINGS_MODULE": 'test_proj.settings',
}

prepare_environment(**settings)
