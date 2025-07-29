# Система опросов

Веб-приложение для создания и проведения опросов с поддержкой временных ограничений и различных типов вопросов.

## Возможности

- ✅ Создание опросов с различными типами вопросов (один вариант, несколько вариантов, текстовый ответ)
- ✅ Временные ограничения для опросов (дата начала и окончания)
- ✅ Автоматическая генерация ссылок для участия в опросах
- ✅ Таймер обратного отсчета для активных опросов
- ✅ Проверка доступности опроса по времени
- ✅ Адаптивный дизайн с Material-UI
- ✅ Валидация форм с Formik и Yup
- ✅ Сохранение данных в localStorage (для демонстрации)

## Технологии

- React 18
- Material-UI (MUI)
- React Router DOM
- Formik + Yup (валидация форм)
- MUI X Date Pickers (выбор даты и времени)
- Axios (HTTP запросы)

## Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn

### Шаги установки

1. **Клонируйте или скачайте проект**
   ```bash
   git clone <url-репозитория>
   cd poll-system
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Запустите приложение**
   ```bash
   npm start
   ```

4. **Откройте в браузере**
   
   Приложение будет доступно по адресу: http://localhost:3000

## Структура проекта

```
src/
├── components/
│   ├── CreatePoll.js      # Форма создания опроса
│   ├── PollView.js        # Просмотр и прохождение опроса
│   └── PollList.js        # Список всех опросов
├── App.js                 # Основной компонент с роутингом
└── index.js              # Точка входа приложения
```

## Использование

### Создание опроса

1. Перейдите на страницу "Создать опрос"
2. Заполните:
   - Название опроса (обязательно)
   - Описание (опционально)
   - Настройки времени (опционально)
   - Добавьте вопросы разных типов
3. Нажмите "Создать опрос"
4. Скопируйте сгенерированную ссылку

### Типы вопросов

- **Один вариант**: Выбор одного варианта из предложенных (radio buttons)
- **Несколько вариантов**: Выбор нескольких вариантов (checkboxes)
- **Текстовый ответ**: Свободный ввод текста

### Временные ограничения

- Установите дату и время начала опроса
- Установите дату и время окончания опроса
- Участники увидят таймер обратного отсчета
- Доступ к опросу автоматически блокируется вне указанного времени

### Участие в опросе

1. Перейдите по ссылке на опрос
2. Ответьте на все вопросы
3. Нажмите "Отправить ответы"
4. Получите подтверждение об успешной отправке

## Команды разработки

```bash
# Запуск в режиме разработки
npm start

# Сборка для продакшена
npm run build

# Запуск тестов
npm test

# Линтинг кода
npm run lint
```

## Настройка для продакшена

### Интеграция с бэкендом

Замените localStorage на реальные API вызовы:

1. **В CreatePoll.js** (строка ~61):
   ```javascript
   // Замените это:
   const response = await axios.post('/api/polls', pollData);
   
   // На ваш реальный API:
   const response = await axios.post('http://your-api.com/api/polls', pollData);
   ```

2. **В PollView.js** (строка ~32):
   ```javascript
   // Замените localStorage на API вызов:
   const response = await axios.get(`/api/polls/${id}`);
   const foundPoll = response.data;
   ```

### Переменные окружения

Создайте файл `.env`:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=production
```

### Структура бэкенда (пример)

```python
# models.py (SQLAlchemy)
class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="poll")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    poll_id = Column(Integer, ForeignKey("polls.id"))
    text = Column(String, nullable=False)
    type = Column(String, nullable=False)  # single, multiple, text
    options = Column(JSON)
    
    poll = relationship("Poll", back_populates="questions")
```

## API Endpoints (рекомендуемые)

```
POST /api/polls              # Создание опроса
GET  /api/polls              # Список опросов
GET  /api/polls/{id}         # Получение опроса
PUT  /api/polls/{id}         # Обновление опроса
DELETE /api/polls/{id}       # Удаление опроса

POST /api/polls/{id}/responses  # Отправка ответов
GET  /api/polls/{id}/results    # Результаты опроса
```

## Решение проблем

### Ошибка с date-fns

Если возникают проблемы с датами:

```bash
npm install @date-io/date-fns@latest
```

### Ошибки CORS

При подключении к бэкенду добавьте CORS настройки:

```javascript
// В вашем backend (Express.js)
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

### Проблемы с Material-UI

Убедитесь, что все компоненты MUI импортированы правильно:

```bash
npm install @mui/material @emotion/react @emotion/styled
```

## Лицензия

MIT License

## Поддержка

Для вопросов и предложений создавайте issues в репозитории проекта.