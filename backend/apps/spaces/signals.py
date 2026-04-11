from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.spaces.models import Space, SpaceMembership

@receiver(post_save, sender=Space)
def create_space_membership_for_owner(sender, instance, created, **kwargs):
    """
    При создании пространства, его создатель (owner) автоматически получает роль 'owner'.
    """
    if created:
        SpaceMembership.objects.create(
            space=instance,
            user=instance.owner,
            role='owner'
        )