import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';

export default function PollView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isNotStarted, setIsNotStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем опрос из localStorage (в реальном приложении - с сервера)
    const polls = JSON.parse(localStorage.getItem('polls') || '[]');
    const foundPoll = polls.find(p => p.id.toString() === id);
    
    if (!foundPoll) {
      alert('Опрос не найден');
      navigate('/');
      return;
    }

    setPoll(foundPoll);
    setLoading(false);

    // Проверяем время начала и окончания
    const now = new Date();
    
    if (foundPoll.startTime && new Date(foundPoll.startTime) > now) {
      setIsNotStarted(true);
      return;
    }

    if (foundPoll.endTime && new Date(foundPoll.endTime) < now) {
      setIsExpired(true);
      return;
    }

    // Инициализируем ответы
    const initialAnswers = {};
    foundPoll.questions.forEach((question, index) => {
      if (question.type === 'multiple') {
        initialAnswers[index] = [];
      } else {
        initialAnswers[index] = '';
      }
    });
    setAnswers(initialAnswers);
  }, [id, navigate]);

  // Таймер для отображения оставшегося времени
  useEffect(() => {
    if (!poll || !poll.endTime || isExpired) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(poll.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Время истекло');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) timeString += `${days}д `;
        if (hours > 0) timeString += `${hours}ч `;
        if (minutes > 0) timeString += `${minutes}м `;
        timeString += `${seconds}с`;

        setTimeLeft(timeString);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [poll, isExpired]);

  const handleAnswerChange = (questionIndex, value, isMultiple = false) => {
    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionIndex] || [];
        if (currentAnswers.includes(value)) {
          return {
            ...prev,
            [questionIndex]: currentAnswers.filter(answer => answer !== value)
          };
        } else {
          return {
            ...prev,
            [questionIndex]: [...currentAnswers, value]
          };
        }
      } else {
        return {
          ...prev,
          [questionIndex]: value
        };
      }
    });
  };

  const handleSubmit = () => {
    // Проверяем, что все вопросы отвечены
    const unansweredQuestions = poll.questions.filter((question, index) => {
      const answer = answers[index];
      if (question.type === 'multiple') {
        return !answer || answer.length === 0;
      }
      return !answer || answer.trim() === '';
    });

    if (unansweredQuestions.length > 0) {
      alert('Пожалуйста, ответьте на все вопросы');
      return;
    }

    // Сохраняем ответы (в реальном приложении - отправляем на сервер)
    const response = {
      pollId: poll.id,
      answers: answers,
      submittedAt: new Date().toISOString()
    };

    const existingResponses = JSON.parse(localStorage.getItem('pollResponses') || '[]');
    existingResponses.push(response);
    localStorage.setItem('pollResponses', JSON.stringify(existingResponses));

    setSubmitted(true);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Загрузка опроса...</Typography>
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Опрос не найден</Alert>
      </Box>
    );
  }

  if (isNotStarted) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="info">
          <Typography variant="h6">Опрос еще не начался</Typography>
          <Typography>
            Опрос начнется: {new Date(poll.startTime).toLocaleString('ru-RU')}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (isExpired) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning">
          <Typography variant="h6">Опрос завершен</Typography>
          <Typography>
            Время для прохождения опроса истекло: {new Date(poll.endTime).toLocaleString('ru-RU')}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="success">
          <Typography variant="h6">Спасибо за участие!</Typography>
          <Typography>
            Ваши ответы успешно отправлены.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 3 }}
        >
          Вернуться на главную
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Заголовок опроса */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {poll.title}
        </Typography>
        {poll.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {poll.description}
          </Typography>
        )}
        
        {/* Таймер */}
        {poll.endTime && timeLeft && (
          <Box display="flex" alignItems="center" gap={1}>
            <TimeIcon color="primary" />
            <Chip
              label={`Осталось времени: ${timeLeft}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Paper>

      {/* Вопросы */}
      {poll.questions.map((question, questionIndex) => (
        <Paper key={questionIndex} elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {questionIndex + 1}. {question.text}
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            {question.type === 'single' && (
              <RadioGroup
                value={answers[questionIndex] || ''}
                onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
              >
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            )}

            {question.type === 'multiple' && (
              <Box>
                <FormLabel component="legend">Выберите все подходящие варианты:</FormLabel>
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    control={
                      <Checkbox
                        checked={(answers[questionIndex] || []).includes(option)}
                        onChange={() => handleAnswerChange(questionIndex, option, true)}
                      />
                    }
                    label={option}
                  />
                ))}
              </Box>
            )}

            {question.type === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Введите ваш ответ..."
                value={answers[questionIndex] || ''}
                onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
              />
            )}
          </FormControl>
        </Paper>
      ))}

      {/* Кнопка отправки */}
      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        sx={{ mt: 3 }}
        fullWidth
      >
        Отправить ответы
      </Button>
    </Box>
  );
}