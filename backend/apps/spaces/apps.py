from django.apps import AppConfig


class SpacesConfig(AppConfig):
    name = 'apps.spaces'

    def ready(self):
        import apps.spaces.signals
