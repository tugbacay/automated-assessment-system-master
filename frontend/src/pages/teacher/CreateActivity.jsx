import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Validation schema
const activitySchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required'),
  type: yup.string().oneOf(['speaking', 'writing', 'quiz'], 'Invalid activity type').required('Type is required'),
  instructions: yup.string().required('Instructions are required'),
  deadline: yup.date().nullable(),
  duration: yup.number().positive('Duration must be positive').nullable(),
  rubricId: yup.string().nullable(),
  status: yup.string().oneOf(['draft', 'active', 'archived']).required('Status is required'),
  prompts: yup.array().of(
    yup.object({
      text: yup.string().required('Prompt text is required'),
      order: yup.number(),
    })
  ),
  questions: yup.array().of(
    yup.object({
      question: yup.string().required('Question is required'),
      options: yup.array().of(yup.string()).min(2, 'At least 2 options required'),
      correctAnswer: yup.number().required('Correct answer is required'),
      points: yup.number().positive('Points must be positive').required('Points are required'),
    })
  ),
}).test('type-specific-fields', 'Invalid fields for activity type', function (value) {
  const { type, prompts, questions } = value;

  if ((type === 'speaking' || type === 'writing') && (!prompts || prompts.length === 0)) {
    return this.createError({
      path: 'prompts',
      message: `At least one prompt is required for ${type} activities`,
    });
  }

  if (type === 'quiz' && (!questions || questions.length === 0)) {
    return this.createError({
      path: 'questions',
      message: 'At least one question is required for quiz activities',
    });
  }

  return true;
});

/**
 * Create/Edit Activity Page
 * Create new teaching activities with dynamic fields based on type
 */
const CreateActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [rubrics, setRubrics] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'speaking',
      instructions: '',
      deadline: null,
      duration: null,
      rubricId: '',
      status: 'draft',
      prompts: [{ text: '', order: 0 }],
      questions: [],
    },
  });

  const { fields: promptFields, append: appendPrompt, remove: removePrompt } = useFieldArray({
    control,
    name: 'prompts',
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  const activityType = watch('type');

  useEffect(() => {
    fetchRubrics();
    if (isEditMode) {
      fetchActivity();
    }
  }, [id]);

  const fetchRubrics = async () => {
    try {
      const response = await api.get('/rubrics/teacher/me');
      setRubrics(response.data?.rubrics || []);
    } catch (err) {
      console.error('Error fetching rubrics:', err);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/activities/${id}`);
      const activity = response.data?.activity;

      if (activity) {
        Object.keys(activity).forEach((key) => {
          setValue(key, activity[key]);
        });
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err.response?.data?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Clean up data based on activity type
      const cleanedData = { ...data };

      if (data.type === 'quiz') {
        delete cleanedData.prompts;
      } else {
        delete cleanedData.questions;
      }

      if (isEditMode) {
        await api.put(`/activities/${id}`, cleanedData);
        toast.success('Activity updated successfully');
      } else {
        await api.post('/activities', cleanedData);
        toast.success('Activity created successfully');
      }

      navigate('/teacher/activities');
    } catch (err) {
      console.error('Error saving activity:', err);
      toast.error(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
        <LoadingSpinner message="Loading activity..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
        <ErrorMessage
          title="Error Loading Activity"
          message={error}
          onRetry={fetchActivity}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/activities')}
          sx={{ mb: 2 }}
        >
          Back to Activities
        </Button>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Activity' : 'Create New Activity'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode ? 'Update activity details and settings.' : 'Create a new activity for your students.'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomCard title="Basic Information">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Activity Title"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Activity Type"
                    fullWidth
                    required
                    error={!!errors.type}
                    helperText={errors.type?.message}
                  >
                    <MenuItem value="speaking">Speaking</MenuItem>
                    <MenuItem value="writing">Writing</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    required
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="instructions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Instructions"
                    fullWidth
                    multiline
                    rows={4}
                    required
                    error={!!errors.instructions}
                    helperText={errors.instructions?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Deadline"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.deadline}
                    helperText={errors.deadline?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Duration (minutes)"
                    type="number"
                    fullWidth
                    error={!!errors.duration}
                    helperText={errors.duration?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    required
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="rubricId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Rubric (Optional)"
                    fullWidth
                    error={!!errors.rubricId}
                    helperText={errors.rubricId?.message || 'Select a rubric for grading'}
                  >
                    <MenuItem value="">No Rubric</MenuItem>
                    {rubrics.map((rubric) => (
                      <MenuItem key={rubric._id} value={rubric._id}>
                        {rubric.name} ({rubric.type})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </CustomCard>

        {/* Dynamic Fields based on Activity Type */}
        {(activityType === 'speaking' || activityType === 'writing') && (
          <CustomCard title="Prompts" sx={{ mt: 3 }}>
            <Box>
              {promptFields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Controller
                      name={`prompts.${index}.text`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={`Prompt ${index + 1}`}
                          fullWidth
                          multiline
                          rows={2}
                          required
                          error={!!errors.prompts?.[index]?.text}
                          helperText={errors.prompts?.[index]?.text?.message}
                        />
                      )}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removePrompt(index)}
                      disabled={promptFields.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => appendPrompt({ text: '', order: promptFields.length })}
                variant="outlined"
              >
                Add Prompt
              </Button>
            </Box>
          </CustomCard>
        )}

        {activityType === 'quiz' && (
          <CustomCard title="Questions" sx={{ mt: 3 }}>
            <Box>
              {questionFields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Question {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeQuestion(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Controller
                        name={`questions.${index}.question`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Question"
                            fullWidth
                            multiline
                            rows={2}
                            required
                            error={!!errors.questions?.[index]?.question}
                            helperText={errors.questions?.[index]?.question?.message}
                          />
                        )}
                      />
                    </Grid>

                    {[0, 1, 2, 3].map((optionIndex) => (
                      <Grid item xs={12} md={6} key={optionIndex}>
                        <Controller
                          name={`questions.${index}.options.${optionIndex}`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={`Option ${optionIndex + 1}`}
                              fullWidth
                              required
                            />
                          )}
                        />
                      </Grid>
                    ))}

                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`questions.${index}.correctAnswer`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            label="Correct Answer"
                            fullWidth
                            required
                            error={!!errors.questions?.[index]?.correctAnswer}
                            helperText={errors.questions?.[index]?.correctAnswer?.message}
                          >
                            <MenuItem value={0}>Option 1</MenuItem>
                            <MenuItem value={1}>Option 2</MenuItem>
                            <MenuItem value={2}>Option 3</MenuItem>
                            <MenuItem value={3}>Option 4</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`questions.${index}.points`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Points"
                            type="number"
                            fullWidth
                            required
                            error={!!errors.questions?.[index]?.points}
                            helperText={errors.questions?.[index]?.points?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  appendQuestion({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    points: 1,
                  })
                }
                variant="outlined"
              >
                Add Question
              </Button>
            </Box>
          </CustomCard>
        )}

        {/* Form Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/teacher/activities')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Activity' : 'Create Activity'}
          </Button>
        </Box>
      </form>
    </TeacherLayout>
  );
};

export default CreateActivity;
