import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
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
 * WritingSubmission Component
 * Rich text editor for writing activities
 */
const WritingSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [activity, setActivity] = useState(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Fetch activity details on component mount
  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    const result = await execute(
      () => api.get(`/activities/${id}`),
      { showErrorToast: true }
    );

    if (result.success) {
      setActivity(result.data.activity || result.data);
      // Load saved draft if exists
      loadDraft();
    }
  };

  const loadDraft = () => {
    const draftKey = `writing_draft_${id}_${user._id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setContent(savedDraft);
    }
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    const draftKey = `writing_draft_${id}_${user._id}`;
    localStorage.setItem(draftKey, content);
    setSavedMessage('Draft saved successfully');
    setIsSaving(false);

    // Clear message after 3 seconds
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!content || content.trim() === '' || content === '<p><br></p>') {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(ENDPOINTS.SUBMISSIONS.WRITING, {
        activityId: id,
        studentId: user._id,
        content: content,
      });

      if (response.success !== false) {
        // Clear draft after successful submission
        const draftKey = `writing_draft_${id}_${user._id}`;
        localStorage.removeItem(draftKey);

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

  // Count words and characters
  const getTextStats = () => {
    // Strip HTML tags for accurate count
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const characters = text.length;

    return { words, characters };
  };

  const stats = getTextStats();

  // Quill editor modules
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'link',
  ];

  if (loading && !activity) {
    return (
      <StudentLayout title="Writing Activity">
        <LoadingSpinner message="Loading activity..." />
      </StudentLayout>
    );
  }

  if (error && !activity) {
    return (
      <StudentLayout title="Writing Activity">
        <ErrorMessage
          title="Error Loading Activity"
          message={error.message}
          onRetry={fetchActivity}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Writing Activity">
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
            <CustomCard title={activity.title} subtitle="Writing Activity" sx={{ mb: 3 }}>
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

              {activity.wordCount && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Target Word Count:
                    </Typography>
                    <Chip
                      label={`${activity.wordCount.min || 0} - ${activity.wordCount.max || 'unlimited'} words`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </>
              )}
            </CustomCard>

            <CustomCard title="Your Writing" sx={{ mb: 3 }}>
              {/* Word/Character Counter */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Words
                    </Typography>
                    <Typography variant="h6">{stats.words}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Characters
                    </Typography>
                    <Typography variant="h6">{stats.characters}</Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDraft}
                  disabled={isSaving || !content}
                >
                  Save Draft
                </Button>
              </Box>

              {savedMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {savedMessage}
                </Alert>
              )}

              {/* Rich Text Editor */}
              <Box
                sx={{
                  '& .quill': {
                    backgroundColor: 'background.paper',
                  },
                  '& .ql-container': {
                    minHeight: '400px',
                    fontSize: '16px',
                  },
                  '& .ql-editor': {
                    minHeight: '400px',
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Start writing your response here..."
                />
              </Box>

              {activity.wordCount && (
                <Box sx={{ mt: 2 }}>
                  {stats.words < (activity.wordCount.min || 0) && (
                    <Alert severity="warning">
                      Your writing is below the minimum word count of {activity.wordCount.min} words.
                    </Alert>
                  )}
                  {activity.wordCount.max && stats.words > activity.wordCount.max && (
                    <Alert severity="warning">
                      Your writing exceeds the maximum word count of {activity.wordCount.max} words.
                    </Alert>
                  )}
                </Box>
              )}
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
                disabled={!content || content.trim() === '' || content === '<p><br></p>' || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Writing'}
              </Button>
            </Box>

            {isSubmitting && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}
      </Box>
    </StudentLayout>
  );
};

export default WritingSubmission;
