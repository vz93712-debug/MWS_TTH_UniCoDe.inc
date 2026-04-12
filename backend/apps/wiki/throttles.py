from rest_framework.throttling import SimpleRateThrottle

class MWSProxyThrottle(SimpleRateThrottle):
    """
    Rate limit 10 req/sec для вызовов MWS API.
    Привязан к user_id, так как у каждого юзера свой токен.
    """
    scope = "mws_api"

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}