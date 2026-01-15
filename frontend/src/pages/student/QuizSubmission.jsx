import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/env';

/**
 * QuizSubmission Component
 * Quiz interface with multiple choice and true/false questions
 */
const QuizSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [activity, setActivity] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAllQuestions, setShowAllQuestions] = useState(true);

  // Fetch activity details on component mount
  useEffect(() => {
    fetchActivity();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (activity?.timeLimit && timeRemaining === null) {
      setTimeRemaining(activity.timeLimit * 60); // Convert minutes to seconds
    }

    if (timeRemaining !== null && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);

      return () => clearInterval(interval);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [activity, timeRemaining]);

  const fetchActivity = async () => {
    const result = await execute(
      () => api.get(`/activities/${id}`),
      { showErrorToast: true }
    );

    if (result.success) {
      const activityData = result.data.activity || result.data;
      setActivity(activityData);
      setQuestions(activityData.questions || []);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && Object.keys(answers).length === 0) {
      return;
    }

    setIsSubmitting(true);

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    try {
      // Format answers for submission
      const formattedAnswers = questions.map((question, index) => ({
        questionId: question._id || index,
        question: question.question,
        selectedAnswer: answers[index] || null,
        correctAnswer: question.correctAnswer,
      }));

      const response = await api.post(ENDPOINTS.SUBMISSIONS.QUIZ, {
        activityId: id,
        studentId: user._id,
        answers: formattedAnswers,
        timeSpent: activity?.timeLimit ? (activity.timeLimit * 60 - (timeRemaining || 0)) : null,
      });

      if (response.success !== false) {
        // Navigate to submission results
        const submissionId = response.data?.submission?._id || response.data?._id;
        navigate(`/student/submissions/${submissionId}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !activity) {
    return (
      <StudentLayout title="Quiz Activity">
        <LoadingSpinner message="Loading quiz..." />
      </StudentLayout>
    );
  }

  if (error && !activity) {
    return (
      <StudentLayout title="Quiz Activity">
        <ErrorMessage
          title="Error Loading Quiz"
          message={error.message}
          onRetry={fetchActivity}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Quiz Activity">
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/student/activities')}
          sx={{ mb: 2 }}
        >
          Back to Activities
        </Button>

        {activity && (
          <>
            <CustomCard title={activity.title} subtitle="Quiz Activity" sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                {activity.description}
              </Typography>

              {activity.instructions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {activity.instructions}
                  </Typography>
                </>
              )}

              {/* Quiz Info */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${questions.length} Questions`}
                  color="primary"
                  variant="outlined"
                />
                {activity.timeLimit && (
                  <Chip
                    icon={<TimerIcon />}
                    label={`${activity.timeLimit} Minutes`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </CustomCard>

            {/* Timer and Progress */}
            <Box sx={{ mb: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6">
                      Progress: {getAnsweredCount()} / {questions.length}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(getAnsweredCount() / questions.length) * 100}
                      sx={{ mt: 1, width: 200 }}
                    />
                  </Box>

                  {timeRemaining !== null && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Time Remaining
                      </Typography>
                      <Typography
                        variant="h5"
                        color={timeRemaining < 60 ? 'error' : 'primary'}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {formatTime(timeRemaining)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {timeRemaining !== null && timeRemaining < 60 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Less than 1 minute remaining! The quiz will auto-submit when time expires.
                  </Alert>
                )}
              </Paper>
            </Box>

            {/* Questions */}
            {showAllQuestions ? (
              // Show all questions at once
              <Box>
                {questions.map((question, index) => (
                  <CustomCard
                    key={index}
                    title={`Question ${index + 1}`}
                    sx={{ mb: 2 }}
                  >
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel component="legend" sx={{ mb: 2 }}>
                        <Typography variant="body1">{question.question}</Typography>
                      </FormLabel>
                      <RadioGroup
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                      >
                        {question.options?.map((option, optionIndex) => (
                          <FormControlLabel
                            key={optionIndex}
                            value={option}
                            control={<Radio />}
                            label={option}
                            sx={{
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </CustomCard>
                ))}
              </Box>
            ) : (
              // Show one question at a time
              <CustomCard
                title={`Question ${currentQuestion + 1} of ${questions.length}`}
                sx={{ mb: 3 }}
              >
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      {questions[currentQuestion]?.question}
                    </Typography>
                  </FormLabel>
                  <RadioGroup
                    value={answers[currentQuestion] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  >
                    {questions[currentQuestion]?.options?.map((option, optionIndex) => (
                      <FormControlLabel
                        key={optionIndex}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{
                          mb: 1,
                          p: 1,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                {/* Navigation Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                    startIcon={<ArrowBackIcon />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleNextQuestion}
                    disabled={currentQuestion === questions.length - 1}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Next
                  </Button>
                </Box>
              </CustomCard>
            )}

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/student/activities')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                onClick={() => handleSubmit(false)}
                disabled={getAnsweredCount() === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </Box>

            {isSubmitting && <LinearProgress sx={{ mt: 2 }} />}

            {getAnsweredCount() < questions.length && !isSubmitting && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You have answered {getAnsweredCount()} out of {questions.length} questions.
                {getAnsweredCount() > 0 && ' You can still submit with unanswered questions.'}
              </Alert>
            )}
          </>
        )}
      </Box>
    </StudentLayout>
  );
};

export default QuizSubmission;
