FROM python:3.11-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем requirements
COPY requirements.txt .

# Устанавливаем Python-зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Создаем директорию для media
RUN mkdir -p media

# Открываем порт
EXPOSE 8000

# Команда по умолчанию (переопределяется в docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]