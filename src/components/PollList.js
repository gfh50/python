import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import {
  Poll as PollIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  Share as ShareIcon
} from '@mui/icons-material';

export default function PollList() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    // Загружаем опросы из localStorage
    const storedPolls = JSON.parse(localStorage.getItem('polls') || '[]');
    setPolls(storedPolls);
  }, []);

  const getStatusChip = (poll) => {
    const now = new Date();
    
    if (poll.startTime && new Date(poll.startTime) > now) {
      return <Chip label="Не начался" color="info" size="small" />;
    }
    
    if (poll.endTime && new Date(poll.endTime) < now) {
      return <Chip label="Завершен" color="error" size="small" />;
    }
    
    return <Chip label="Активен" color="success" size="small" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const handleDeletePoll = (pollId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот опрос?')) {
      const updatedPolls = polls.filter(poll => poll.id !== pollId);
      setPolls(updatedPolls);
      localStorage.setItem('polls', JSON.stringify(updatedPolls));
    }
  };

  const handleSharePoll = (pollId) => {
    const link = `${window.location.origin}/poll/${pollId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      alert('Ссылка скопирована в буфер обмена!');
    } else {
      prompt('Скопируйте ссылку:', link);
    }
  };

  if (polls.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <PollIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Опросов пока нет
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Создайте ваш первый опрос, чтобы начать собирать мнения пользователей.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/create')}
        >
          Создать опрос
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Все опросы
      </Typography>
      
      <Button
        variant="contained"
        onClick={() => navigate('/create')}
        sx={{ mb: 3 }}
      >
        Создать новый опрос
      </Button>

      <Grid container spacing={3}>
        {polls.map((poll) => (
          <Grid item xs={12} md={6} lg={4} key={poll.id}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {poll.title}
                  </Typography>
                  {getStatusChip(poll)}
                </Box>
                
                {poll.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {poll.description}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                  Вопросов: {poll.questions.length}
                </Typography>

                {poll.startTime && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="caption">
                      Начало: {formatDate(poll.startTime)}
                    </Typography>
                  </Box>
                )}

                {poll.endTime && (
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="caption">
                      Окончание: {formatDate(poll.endTime)}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(`/poll/${poll.id}`)}
                >
                  Открыть
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleSharePoll(poll.id)}
                  title="Поделиться ссылкой"
                >
                  <ShareIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeletePoll(poll.id)}
                  title="Удалить опрос"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}