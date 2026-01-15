import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  IconButton,
  Paper,
  Divider,
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
const rubricSchema = yup.object({
  name: yup.string().required('Rubric name is required').min(3, 'Name must be at least 3 characters'),
  description: yup.string(),
  type: yup.string().oneOf(['speaking', 'writing', 'quiz'], 'Invalid rubric type').required('Type is required'),
  criteria: yup.array()
    .of(
      yup.object({
        name: yup.string().required('Criterion name is required'),
        description: yup.string().required('Criterion description is required'),
        maxScore: yup.number()
          .positive('Max score must be positive')
          .required('Max score is required')
          .min(1, 'Max score must be at least 1'),
      })
    )
    .min(1, 'At least one criterion is required'),
});

/**
 * Create/Edit Rubric Page
 * Create new evaluation rubric with dynamic criteria
 */
const CreateRubric = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(rubricSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'speaking',
      criteria: [
        {
          name: '',
          description: '',
          maxScore: 10,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchRubric();
    }
  }, [id]);

  const fetchRubric = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/rubrics/${id}`);
      const rubric = response.data?.rubric;

      if (rubric) {
        setValue('name', rubric.name);
        setValue('description', rubric.description || '');
        setValue('type', rubric.type);
        setValue('criteria', rubric.criteria || []);
      }
    } catch (err) {
      console.error('Error fetching rubric:', err);
      setError(err.response?.data?.message || 'Failed to load rubric');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      if (isEditMode) {
        await api.put(`/rubrics/${id}`, data);
        toast.success('Rubric updated successfully');
      } else {
        await api.post('/rubrics', data);
        toast.success('Rubric created successfully');
      }

      navigate('/teacher/rubrics');
    } catch (err) {
      console.error('Error saving rubric:', err);
      toast.error(err.response?.data?.message || 'Failed to save rubric');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalScore = () => {
    return fields.reduce((sum, field, index) => {
      const value = control._formValues.criteria?.[index]?.maxScore || 0;
      return sum + Number(value);
    }, 0);
  };

  if (loading) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
        <LoadingSpinner message="Loading rubric..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
        <ErrorMessage
          title="Error Loading Rubric"
          message={error}
          onRetry={fetchRubric}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/rubrics')}
          sx={{ mb: 2 }}
        >
          Back to Rubrics
        </Button>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Rubric' : 'Create New Rubric'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode
            ? 'Update rubric details and grading criteria.'
            : 'Create a new evaluation rubric for assessing student work.'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomCard title="Basic Information">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Rubric Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Speaking Proficiency Rubric"
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
                    helperText={errors.type?.message || 'Select the type of activity this rubric is for'}
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
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Describe the purpose and scope of this rubric..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </CustomCard>

        <CustomCard title="Grading Criteria" sx={{ mt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Define the criteria that will be used to evaluate student submissions. Each criterion should
              have a clear name, description, and maximum score.
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Total Points: <strong>{calculateTotalScore()}</strong>
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {fields.map((field, index) => (
            <Paper
              key={field.id}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Criterion {index + 1}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Controller
                    name={`criteria.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Criterion Name"
                        fullWidth
                        required
                        error={!!errors.criteria?.[index]?.name}
                        helperText={errors.criteria?.[index]?.name?.message}
                        placeholder="e.g., Pronunciation, Grammar, Content Organization"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name={`criteria.${index}.maxScore`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Max Score"
                        type="number"
                        fullWidth
                        required
                        error={!!errors.criteria?.[index]?.maxScore}
                        helperText={errors.criteria?.[index]?.maxScore?.message}
                        inputProps={{ min: 1, step: 1 }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name={`criteria.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        required
                        error={!!errors.criteria?.[index]?.description}
                        helperText={
                          errors.criteria?.[index]?.description?.message ||
                          'Describe what this criterion evaluates and how it should be assessed'
                        }
                        placeholder="Describe what aspects should be evaluated under this criterion..."
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
              append({
                name: '',
                description: '',
                maxScore: 10,
              })
            }
            variant="outlined"
            fullWidth
          >
            Add Criterion
          </Button>

          {errors.criteria && typeof errors.criteria === 'object' && !Array.isArray(errors.criteria) && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {errors.criteria.message}
            </Typography>
          )}
        </CustomCard>

        {/* Form Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/teacher/rubrics')}
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
            {submitting ? 'Saving...' : isEditMode ? 'Update Rubric' : 'Create Rubric'}
          </Button>
        </Box>
      </form>
    </TeacherLayout>
  );
};

export default CreateRubric;
