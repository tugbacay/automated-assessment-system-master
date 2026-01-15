import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  Chip,
  Divider,
  Paper,
  Slider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Evaluation Review Page
 * Review and grade student submissions with AI assistance
 */
const EvaluationReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState({});
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [overallScore, setOverallScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/submissions/${id}`);
      const submissionData = response.data?.submission;
      const evaluationData = response.data?.evaluation;

      setSubmission(submissionData);
      setEvaluation(evaluationData);

      // Initialize criteria scores from AI evaluation or rubric
      if (evaluationData?.criteriaScores) {
        setCriteriaScores(evaluationData.criteriaScores);
        setOverallScore(evaluationData.totalScore || 0);
      } else if (submissionData?.activity?.rubric?.criteria) {
        const initialScores = {};
        submissionData.activity.rubric.criteria.forEach((criterion) => {
          initialScores[criterion._id] = 0;
        });
        setCriteriaScores(initialScores);
      }

      setTeacherFeedback(evaluationData?.teacherFeedback || '');
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError(err.response?.data?.message || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaScoreChange = (criterionId, value) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: value,
    }));

    // Recalculate overall score
    const total = Object.values({ ...criteriaScores, [criterionId]: value }).reduce(
      (sum, score) => sum + score,
      0
    );
    setOverallScore(total);
  };

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);

      const reviewData = {
        submissionId: id,
        criteriaScores,
        totalScore: overallScore,
        teacherFeedback,
        status: 'reviewed',
      };

      await api.post(`/submissions/${id}/review`, reviewData);
      toast.success('Review submitted successfully');
      navigate('/teacher/reviews');
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAudio = () => {
    // Implement audio playback for speaking submissions
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <TeacherLayout title="Review Submission">
        <LoadingSpinner message="Loading submission..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Review Submission">
        <ErrorMessage
          title="Error Loading Submission"
          message={error}
          onRetry={fetchSubmissionDetails}
        />
      </TeacherLayout>
    );
  }

  if (!submission) {
    return (
      <TeacherLayout title="Review Submission">
        <Alert severity="error">Submission not found</Alert>
      </TeacherLayout>
    );
  }

  const activityType = submission.activity?.type;
  const rubric = submission.activity?.rubric;

  return (
    <TeacherLayout title="Review Submission">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/reviews')}
          sx={{ mb: 2 }}
        >
          Back to Reviews
        </Button>
        <Typography variant="h4" gutterBottom>
          Review Submission
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Evaluate student work and provide feedback.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Submission Details */}
        <Grid item xs={12} md={8}>
          <CustomCard title="Submission Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Student
                </Typography>
                <Typography variant="body1">{submission.student?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Activity
                </Typography>
                <Typography variant="body1">{submission.activity?.title}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Chip label={activityType} size="small" color="primary" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Submitted
                </Typography>
                <Typography variant="body1">
                  {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
              </Grid>
            </Grid>
          </CustomCard>

          {/* Student Work */}
          <CustomCard title="Student Work" sx={{ mt: 3 }}>
            {activityType === 'speaking' && (
              <Box>
                {submission.audioUrl ? (
                  <Box>
                    <audio controls style={{ width: '100%' }}>
                      <source src={submission.audioUrl} type="audio/webm" />
                      Your browser does not support the audio element.
                    </audio>
                    {submission.transcript && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Transcript
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="body2">{submission.transcript}</Typography>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">No audio recording available</Alert>
                )}
              </Box>
            )}

            {activityType === 'writing' && (
              <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {submission.content || 'No content submitted'}
                </Typography>
              </Paper>
            )}

            {activityType === 'quiz' && (
              <Box>
                {submission.answers?.map((answer, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Question {index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {answer.question}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2">Answer: {answer.selectedAnswer}</Typography>
                      {answer.isCorrect ? (
                        <Chip label="Correct" size="small" color="success" />
                      ) : (
                        <Chip label="Incorrect" size="small" color="error" />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </CustomCard>

          {/* AI Feedback */}
          {evaluation?.aiFeedback && (
            <CustomCard title="AI-Generated Feedback" sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                This is automatically generated feedback. Please review and adjust as needed.
              </Alert>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {evaluation.aiFeedback}
              </Typography>
            </CustomCard>
          )}
        </Grid>

        {/* Grading Section */}
        <Grid item xs={12} md={4}>
          <CustomCard title="Grading">
            {rubric && rubric.criteria ? (
              <Box>
                <List>
                  {rubric.criteria.map((criterion) => (
                    <ListItem key={criterion._id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {criterion.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {criterion.description}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">
                            Score: {criteriaScores[criterion._id] || 0} / {criterion.maxScore}
                          </Typography>
                        </Box>
                        <Slider
                          value={criteriaScores[criterion._id] || 0}
                          onChange={(e, value) => handleCriteriaScoreChange(criterion._id, value)}
                          min={0}
                          max={criterion.maxScore}
                          step={0.5}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                      <Divider sx={{ width: '100%', mt: 2 }} />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="h6" align="center">
                    Total Score: {overallScore.toFixed(1)} / {rubric.criteria.reduce((sum, c) => sum + c.maxScore, 0)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Alert severity="warning">No rubric assigned to this activity</Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <TextField
                label="Teacher Feedback"
                multiline
                rows={6}
                fullWidth
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                placeholder="Provide detailed feedback to the student..."
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmitReview}
              disabled={submitting}
              sx={{ mt: 2 }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CustomCard>
        </Grid>
      </Grid>
    </TeacherLayout>
  );
};

export default EvaluationReview;
