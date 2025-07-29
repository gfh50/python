import React, { useState } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Button,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Link,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox,
  IconButton,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const pollSchema = Yup.object().shape({
  title: Yup.string().required('Обязательное поле'),
  description: Yup.string(),
  timeLimitEnabled: Yup.boolean(),
  startTime: Yup.date().when('timeLimitEnabled', {
    is: true,
    then: (schema) => schema.required('Укажите время начала')
  }),
  endTime: Yup.date().when('timeLimitEnabled', {
    is: true,
    then: (schema) => schema
      .required('Укажите время окончания')
      .min(Yup.ref('startTime'), 'Время окончания должно быть после начала')
  }),
  questions: Yup.array()
    .of(
      Yup.object().shape({
        text: Yup.string().required('Вопрос обязателен'),
        type: Yup.string().required('Выберите тип вопроса'),
        options: Yup.array().when('type', {
          is: (type) => type !== 'text',
          then: (schema) => schema
            .of(Yup.string().required('Вариант не может быть пустым'))
            .min(1, 'Нужен хотя бы один вариант')
        })
      })
    )
    .min(1, 'Добавьте хотя бы один вопрос')
});

export default function CreatePoll() {
  const navigate = useNavigate();
  const [generatedLink, setGeneratedLink] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Имитация API вызова (замените на реальный URL вашего бэкенда)
      const pollData = {
        ...values,
        startTime: values.timeLimitEnabled ? values.startTime : null,
        endTime: values.timeLimitEnabled ? values.endTime : null,
        id: Date.now() // Имитация ID от сервера
      };
      
      console.log('Создаем опрос:', pollData);
      
      // Сохраняем в localStorage для демонстрации
      const existingPolls = JSON.parse(localStorage.getItem('polls') || '[]');
      existingPolls.push(pollData);
      localStorage.setItem('polls', JSON.stringify(existingPolls));
      
      const link = `${window.location.origin}/poll/${pollData.id}`;
      setGeneratedLink(link);
      setOpenSnackbar(true);
      
      // Копируем в буфер обмена
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link);
      }
    } catch (error) {
      console.error('Ошибка при создании опроса:', error);
      alert('Ошибка при создании опроса. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Создать новый опрос
      </Typography>
      
      <Formik
        initialValues={{
          title: '',
          description: '',
          timeLimitEnabled: false,
          startTime: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 день
          questions: [{ text: '', type: 'single', options: [''] }]
        }}
        validationSchema={pollSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, handleChange }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Field
                  name="title"
                  as={TextField}
                  label="Название опроса*"
                  fullWidth
                  error={touched.title && !!errors.title}
                  helperText={touched.title && errors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <Field
                  name="description"
                  as={TextField}
                  label="Описание"
                  fullWidth
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.timeLimitEnabled}
                      onChange={(e) => setFieldValue('timeLimitEnabled', e.target.checked)}
                    />
                  }
                  label="Ограничить время прохождения опроса"
                />
              </Grid>

              {values.timeLimitEnabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Начало опроса"
                      value={values.startTime}
                      onChange={(newValue) => setFieldValue('startTime', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.startTime && !!errors.startTime}
                          helperText={touched.startTime && errors.startTime}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Окончание опроса"
                      value={values.endTime}
                      onChange={(newValue) => setFieldValue('endTime', newValue)}
                      minDateTime={values.startTime}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.endTime && !!errors.endTime}
                          helperText={touched.endTime && errors.endTime}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Вопросы опроса
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FieldArray name="questions">
                  {({ push, remove }) => (
                    <>
                      {values.questions.map((question, questionIndex) => (
                        <Paper key={questionIndex} elevation={2} sx={{ p: 3, mb: 3 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">
                                  Вопрос {questionIndex + 1}
                                </Typography>
                                {values.questions.length > 1 && (
                                  <IconButton
                                    color="error"
                                    onClick={() => remove(questionIndex)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Field
                                name={`questions[${questionIndex}].text`}
                                as={TextField}
                                label="Текст вопроса*"
                                fullWidth
                                error={
                                  touched.questions?.[questionIndex]?.text &&
                                  !!errors.questions?.[questionIndex]?.text
                                }
                                helperText={
                                  touched.questions?.[questionIndex]?.text &&
                                  errors.questions?.[questionIndex]?.text
                                }
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth>
                                <InputLabel>Тип вопроса*</InputLabel>
                                <Select
                                  value={question.type}
                                  label="Тип вопроса*"
                                  onChange={(e) => {
                                    setFieldValue(`questions[${questionIndex}].type`, e.target.value);
                                    if (e.target.value === 'text') {
                                      setFieldValue(`questions[${questionIndex}].options`, []);
                                    } else if (question.options.length === 0) {
                                      setFieldValue(`questions[${questionIndex}].options`, ['']);
                                    }
                                  }}
                                >
                                  <MenuItem value="single">Один вариант</MenuItem>
                                  <MenuItem value="multiple">Несколько вариантов</MenuItem>
                                  <MenuItem value="text">Текстовый ответ</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            {question.type !== 'text' && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                  Варианты ответов:
                                </Typography>
                                <FieldArray name={`questions[${questionIndex}].options`}>
                                  {({ push: pushOption, remove: removeOption }) => (
                                    <>
                                      {question.options.map((option, optionIndex) => (
                                        <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                                          <Field
                                            name={`questions[${questionIndex}].options[${optionIndex}]`}
                                            as={TextField}
                                            label={`Вариант ${optionIndex + 1}`}
                                            fullWidth
                                            sx={{ mr: 1 }}
                                          />
                                          {question.options.length > 1 && (
                                            <IconButton
                                              color="error"
                                              onClick={() => removeOption(optionIndex)}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          )}
                                        </Box>
                                      ))}
                                      <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => pushOption('')}
                                        variant="outlined"
                                        size="small"
                                      >
                                        Добавить вариант
                                      </Button>
                                    </>
                                  )}
                                </FieldArray>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      ))}

                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push({ text: '', type: 'single', options: [''] })}
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 3 }}
                      >
                        Добавить вопрос
                      </Button>
                    </>
                  )}
                </FieldArray>
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Создаем опрос...' : 'Создать опрос'}
            </Button>
          </Form>
        )}
      </Formik>

      {/* Отображение сгенерированной ссылки */}
      {generatedLink && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Опрос успешно создан!
          </Typography>
          <Typography variant="body2" gutterBottom>
            Ссылка на опрос:
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Link href={generatedLink} target="_blank" sx={{ wordBreak: 'break-all' }}>
              {generatedLink}
            </Link>
            <Button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(generatedLink);
                  alert('Ссылка скопирована в буфер обмена!');
                }
              }}
              variant="outlined"
              size="small"
            >
              Копировать
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Опрос создан! Ссылка скопирована в буфер обмена!
        </Alert>
      </Snackbar>
    </Box>
  );
}