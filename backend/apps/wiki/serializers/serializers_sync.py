from rest_framework import serializers


class PresenceSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    display_name = serializers.CharField()
    email = serializers.EmailField()
    last_seen = serializers.DateTimeField()
    is_current_user = serializers.SerializerMethodField()

    def get_is_current_user(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return str(obj.get("user_id")) == str(request.user.id)
        return False


class SyncStateSerializer(serializers.Serializer):
    server_yjs_version = serializers.IntegerField()
    last_saved_at = serializers.DateTimeField()
    is_offline_pending = serializers.BooleanField()
    active_users = PresenceSerializer(many=True)
