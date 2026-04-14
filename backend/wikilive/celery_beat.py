from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Пример: очистка старых задач раз в сутки
    "cleanup-old-tasks": {
        "task": "apps.wiki.tasks.cleanup_old_ai_tasks",
        "schedule": crontab(hour=3, minute=0),
    },
}
