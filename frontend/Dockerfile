FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Открываем порт Vite
EXPOSE 5173

# Команда по умолчанию (переопределяется в docker-compose)
CMD ["npm", "run", "dev"]