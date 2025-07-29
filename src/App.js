import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';
import PollList from './components/PollList';

function App() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Система опросов
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>
            Главная
          </Button>
          <Button color="inherit" onClick={() => navigate('/create')}>
            Создать опрос
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<PollList />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<PollView />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;