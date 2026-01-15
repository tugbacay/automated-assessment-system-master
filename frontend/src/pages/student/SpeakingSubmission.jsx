import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactMediaRecorder } from 'react-media-recorder';
import {
  Typography,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Replay as ReplayIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
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
 * SpeakingSubmission Component
 * Audio recording interface for speaking activities
 */
const SpeakingSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [activity, setActivity] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      setAudioBlob(blob);
      setAudioUrl(blobUrl);
      stopTimer();
    },
  });

  // Fetch activity details on component mount
  useEffect(() => {
    fetchActivity();
  }, [id]);

  // Recording timer
  useEffect(() => {
    if (status === 'recording') {
      startTimer();
    } else if (status === 'paused') {
      stopTimer();
    } else if (status === 'stopped') {
      stopTimer();
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [status]);

  const fetchActivity = async () => {
    const result = await execute(
      () => api.get(`/activities/${id}`),
      { showErrorToast: true }
    );

    if (result.success) {
      setActivity(result.data.activity || result.data);
    }
  };

  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const handleStartRecording = () => {
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    clearBlobUrl();
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handlePauseRecording = () => {
    pauseRecording();
  };

  const handleResumeRecording = () => {
    resumeRecording();
  };

  const handleReset = () => {
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    clearBlobUrl();
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('activityId', id);
      formData.append('studentId', user._id);
      formData.append('audio', audioBlob, 'recording.webm');

      // Upload audio file
      const response = await api.post(ENDPOINTS.SUBMISSIONS.SPEAKING, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !activity) {
    return (
      <StudentLayout title="Speaking Activity">
        <LoadingSpinner message="Loading activity..." />
      </StudentLayout>
    );
  }

  if (error && !activity) {
    return (
      <StudentLayout title="Speaking Activity">
        <ErrorMessage
          title="Error Loading Activity"
          message={error.message}
          onRetry={fetchActivity}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Speaking Activity">
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
            <CustomCard title={activity.title} subtitle="Speaking Activity" sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                {activity.description}
              </Typography>

              {activity.instructions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {activity.instructions}
                  </Typography>
                </>
              )}

              {activity.prompts && activity.prompts.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Prompts
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {activity.prompts.map((prompt, index) => (
                      <Typography
                        component="li"
                        key={index}
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {prompt}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </CustomCard>

            <CustomCard title="Audio Recording" sx={{ mb: 3 }}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                {/* Recording Status */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Typography variant="h4" gutterBottom>
                    {formatDuration(recordingDuration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {status === 'recording' && 'Recording...'}
                    {status === 'paused' && 'Paused'}
                    {status === 'stopped' && recordingDuration > 0 && 'Recording Complete'}
                    {status === 'idle' && 'Ready to Record'}
                  </Typography>
                </Paper>

                {/* Recording Controls */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  {status === 'idle' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<MicIcon />}
                      onClick={handleStartRecording}
                    >
                      Start Recording
                    </Button>
                  )}

                  {status === 'recording' && (
                    <>
                      <IconButton
                        color="warning"
                        size="large"
                        onClick={handlePauseRecording}
                      >
                        <PauseIcon fontSize="large" />
                      </IconButton>
                      <IconButton color="error" size="large" onClick={handleStopRecording}>
                        <StopIcon fontSize="large" />
                      </IconButton>
                    </>
                  )}

                  {status === 'paused' && (
                    <>
                      <IconButton
                        color="primary"
                        size="large"
                        onClick={handleResumeRecording}
                      >
                        <PlayArrowIcon fontSize="large" />
                      </IconButton>
                      <IconButton color="error" size="large" onClick={handleStopRecording}>
                        <StopIcon fontSize="large" />
                      </IconButton>
                    </>
                  )}

                  {status === 'stopped' && audioUrl && (
                    <IconButton color="secondary" size="large" onClick={handleReset}>
                      <ReplayIcon fontSize="large" />
                    </IconButton>
                  )}
                </Box>

                {/* Audio Playback */}
                {audioUrl && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Preview Your Recording
                    </Typography>
                    <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 400 }} />
                  </Box>
                )}

                {/* Status Messages */}
                {status === 'recording' && (
                  <Alert severity="info" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
                    Recording in progress. Speak clearly into your microphone.
                  </Alert>
                )}

                {status === 'stopped' && audioUrl && (
                  <Alert severity="success" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
                    Recording saved! Preview your recording and submit when ready.
                  </Alert>
                )}
              </Box>
            </CustomCard>

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
                onClick={handleSubmit}
                disabled={!audioBlob || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Recording'}
              </Button>
            </Box>

            {isSubmitting && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}
      </Box>
    </StudentLayout>
  );
};

export default SpeakingSubmission;
