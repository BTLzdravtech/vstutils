import os
import sys

default_settings = {
    # vstutils settings for generate settings
    "VST_PROJECT": "vstutils",
    'VST_DEV_SETTINGS': 'settings.ini',
    # django settings module
    "DJANGO_SETTINGS_MODULE": 'vstutils.settings',
}


def prepare_environment(default_settings=default_settings, **kwargs):
    # pylint: disable=unused-argument
    '''
    Prepare ENV for web-application
    :param default_settings: minimal needed settings for run app
    :type default_settings: dict
    :param kwargs: other overrided settings
    :rtype: None
    '''
    for key, value in default_settings.items():
        os.environ.setdefault(key, value)
    os.environ.update(kwargs)


def cmd_execution(*args, **kwargs):
    # pylint: disable=unused-variable
    '''
    Main function to executes from cmd. Emulates django-admin.py execution.
    :param kwargs: overrided env-settings
    :rtype: None
    '''
    from django.core.management import execute_from_command_line
    prepare_environment(**kwargs)
    execute_from_command_line(args or sys.argv)


def get_celery_app(name, **kwargs):  # nocv
    '''
    Function to return celery-app. Works only if celery installed.
    :param name: Application name
    :param kwargs: overrided env-settings
    :return: Celery-app object
    '''
    from celery import Celery
    prepare_environment(**kwargs)
    celery_app = Celery(name)
    celery_app.config_from_object('django.conf:settings', namespace='CELERY')
    celery_app.autodiscover_tasks()
    return celery_app
