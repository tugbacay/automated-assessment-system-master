import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Grade as GradeIcon,
  Feedback as FeedbackIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/env';
import { ACTIVITY_TYPES, SUBMISSION_STATUS } from '../../utils/constants';
import { format } from 'date-fns';

/**
 * SubmissionResults Component
 * Display submission details and AI-generated evaluation results
 */
const SubmissionResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [submission, setSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  // Fetch submission details on component mount
  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    const result = await execute(
      () => api.get(ENDPOINTS.SUBMISSIONS.BY_ID(id)),
      { showErrorToast: true }
    );

    if (result.success) {
      const submissionData = result.data.submission || result.data;
      setSubmission(submissionData);

      // Fetch evaluation if submission is completed
      if (submissionData.status === SUBMISSION_STATUS.COMPLETED && submissionData.evaluationId) {
        fetchEvaluation(submissionData.evaluationId);
      }
    }
  };

  const fetchEvaluation = async (evaluationId) => {
    const result = await execute(
      () => api.get(ENDPOINTS.EVALUATIONS.BY_ID(evaluationId)),
      { showErrorToast: false }
    );

    if (result.success) {
      setEvaluation(result.data.evaluation || result.data);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [SUBMISSION_STATUS.PENDING]: 'warning',
      [SUBMISSION_STATUS.EVALUATING]: 'info',
      [SUBMISSION_STATUS.COMPLETED]: 'success',
      [SUBMISSION_STATUS.FAILED]: 'error',
    };
    return colors[status] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading && !submission) {
    return (
      <StudentLayout title="Submission Results">
        <LoadingSpinner message="Loading submission..." />
      </StudentLayout>
    );
  }

  if (error && !submission) {
    return (
      <StudentLayout title="Submission Results">
        <ErrorMessage
          title="Error Loading Submission"
          message={error.message}
          onRetry={fetchSubmission}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Submission Results">
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/student/activities')}
          sx={{ mb: 2 }}
        >
          Back to Activities
        </Button>

        {submission && (
          <>
            {/* Submission Header */}
            <CustomCard sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {submission.activityId?.title || 'Submission'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submitted on {format(new Date(submission.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
                <Chip
                  label={submission.status}
                  color={getStatusColor(submission.status)}
                  icon={submission.status === SUBMISSION_STATUS.COMPLETED ? <CheckCircleIcon /> : undefined}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip
                  label={submission.activityId?.type || 'Unknown'}
                  variant="outlined"
                  size="small"
                />
                {evaluation?.overallScore !== undefined && (
                  <Chip
                    label={`Score: ${evaluation.overallScore.toFixed(1)}%`}
                    color={getScoreColor(evaluation.overallScore)}
                    icon={<GradeIcon />}
                  />
                )}
              </Box>
            </CustomCard>

            {/* Evaluation Status */}
            {submission.status === SUBMISSION_STATUS.EVALUATING && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Your submission is being evaluated. Please check back later for results.
              </Alert>
            )}

            {submission.status === SUBMISSION_STATUS.FAILED && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Evaluation failed. Please contact your teacher or try submitting again.
              </Alert>
            )}

            {submission.status === SUBMISSION_STATUS.PENDING && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Your submission is pending evaluation.
              </Alert>
            )}

            {/* Overall Score */}
            {evaluation && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <CustomCard title="Overall Score">
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography
                        variant="h2"
                        color={getScoreColor(evaluation.overallScore)}
                        gutterBottom
                      >
                        {evaluation.overallScore.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={evaluation.overallScore}
                        color={getScoreColor(evaluation.overallScore)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </CustomCard>
                </Grid>

                {/* Rubric Scores */}
                {evaluation.rubricScores && evaluation.rubricScores.length > 0 && (
                  <Grid item xs={12} md={8}>
                    <CustomCard title="Score Breakdown">
                      <Grid container spacing={2}>
                        {evaluation.rubricScores.map((rubricScore, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {rubricScore.criterionName || `Criterion ${index + 1}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {rubricScore.score?.toFixed(1) || 0}/{rubricScore.maxScore || 100}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(rubricScore.score / (rubricScore.maxScore || 100)) * 100}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CustomCard>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Submission Content */}
            {submission.activityId?.type === ACTIVITY_TYPES.SPEAKING && submission.audioUrl && (
              <CustomCard title="Your Recording" sx={{ mt: 3 }}>
                <audio controls src={submission.audioUrl} style={{ width: '100%' }} />
              </CustomCard>
            )}

            {submission.activityId?.type === ACTIVITY_TYPES.WRITING && submission.content && (
              <CustomCard title="Your Writing" sx={{ mt: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                  }}
                  dangerouslySetInnerHTML={{ __html: submission.content }}
                />
              </CustomCard>
            )}

            {submission.activityId?.type === ACTIVITY_TYPES.QUIZ && submission.answers && (
              <CustomCard title="Your Answers" sx={{ mt: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Question</TableCell>
                        <TableCell>Your Answer</TableCell>
                        <TableCell>Correct Answer</TableCell>
                        <TableCell align="center">Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submission.answers.map((answer, index) => {
                        const isCorrect = answer.selectedAnswer === answer.correctAnswer;
                        return (
                          <TableRow key={index}>
                            <TableCell>{answer.question}</TableCell>
                            <TableCell>{answer.selectedAnswer || 'Not answered'}</TableCell>
                            <TableCell>{answer.correctAnswer}</TableCell>
                            <TableCell align="center">
                              {isCorrect ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CancelIcon color="error" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CustomCard>
            )}

            {/* AI Feedback */}
            {evaluation?.feedback && (
              <CustomCard title="AI-Generated Feedback" icon={<FeedbackIcon />} sx={{ mt: 3 }}>
                <Typography variant="body1" paragraph>
                  {evaluation.feedback}
                </Typography>
              </CustomCard>
            )}

            {/* Suggestions for Improvement */}
            {evaluation?.suggestions && evaluation.suggestions.length > 0 && (
              <CustomCard title="Suggestions for Improvement" icon={<TrendingUpIcon />} sx={{ mt: 3 }}>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {evaluation.suggestions.map((suggestion, index) => (
                    <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                      {suggestion}
                    </Typography>
                  ))}
                </Box>
              </CustomCard>
            )}

            {/* Detected Mistakes */}
            {evaluation?.mistakes && evaluation.mistakes.length > 0 && (
              <CustomCard title="Detected Issues" sx={{ mt: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Suggestion</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {evaluation.mistakes.map((mistake, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip label={mistake.type} size="small" />
                          </TableCell>
                          <TableCell>{mistake.description}</TableCell>
                          <TableCell>
                            <Chip
                              label={mistake.severity}
                              size="small"
                              color={
                                mistake.severity === 'critical'
                                  ? 'error'
                                  : mistake.severity === 'major'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{mistake.suggestion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CustomCard>
            )}

            {/* Teacher Review */}
            {evaluation?.teacherReview && (
              <CustomCard title="Teacher Review" sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Reviewed by teacher on {format(new Date(evaluation.reviewedAt), 'MMM dd, yyyy HH:mm')}
                </Alert>
                <Typography variant="body1" paragraph>
                  {evaluation.teacherReview}
                </Typography>
                {evaluation.teacherScore !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Teacher Score
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {evaluation.teacherScore}%
                    </Typography>
                  </Box>
                )}
              </CustomCard>
            )}
          </>
        )}
      </Box>
    </StudentLayout>
  );
};

export default SubmissionResults;
