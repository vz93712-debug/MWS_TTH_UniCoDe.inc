from celery import shared_task
from django.core.cache import cache
from .services.mws_gpt import MWSGPTService

# TTL для результатов задач в кэше (1 час)
TASK_RESULT_TTL = 3600


@shared_task(bind=True, name="wiki.ai_generate_table")
def generate_table_task(self, user_id: int, page_id: str, user_prompt: str):
    """Асинхронная генерация таблицы через MWS GPT."""
    try:
        result = MWSGPTService.generate_table_macro(user_prompt)
        
        if "error" in result:
            return {"status": "failed", "error": result}
        
        return {
            "status": "completed",
            "data": result,
            "page_id": page_id
        }
        
    except Exception as e:
        return {"status": "failed", "error": {"message": str(e)}}
    

@shared_task(bind=True, name="wiki.ai_edit_text")
def edit_text_task(self, user_id: int, text: str, action: str, context: str = None):
    """Асинхронное редактирование текста через MWS GPT."""
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)
    
    try:
        result = MWSGPTService.edit_text(text, action, context)
        
        if "error" in result:
            cache.set(f"ai_task:{task_id}", {
                "status": "failed",
                "error": result
            }, timeout=TASK_RESULT_TTL)
            return result
        
        cache.set(f"ai_task:{task_id}", {
            "status": "completed",
            "data": result
        }, timeout=TASK_RESULT_TTL)
        
        return result
        
    except Exception as e:
        cache.set(f"ai_task:{task_id}", {
            "status": "failed",
            "error": {"message": str(e)}
        }, timeout=TASK_RESULT_TTL)
        return {"error": str(e)}