import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  Paper,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

const AIModelManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [config, setConfig] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  const [promptTemplates, setPromptTemplates] = useState({
    essay: 'Evaluate the following essay based on clarity, structure, and content...',
    code: 'Review the following code for correctness, efficiency, and best practices...',
    math: 'Assess the following mathematical solution for accuracy and methodology...',
  });

  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/ai-models');
      setConfig(response.data.config || config);
      setPromptTemplates(response.data.promptTemplates || promptTemplates);
    } catch (error) {
      console.error('Error fetching AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await api.post('/admin/ai-models', { config, promptTemplates });
      setSnackbar({ open: true, message: 'Configuration saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving config:', error);
      setSnackbar({ open: true, message: 'Failed to save configuration', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestModel = async () => {
    try {
      setTesting(true);
      const response = await api.post('/admin/ai-models/test', { input: testInput, config });
      setTestOutput(response.data.output || 'Test completed successfully');
    } catch (error) {
      console.error('Error testing model:', error);
      setTestOutput('Error testing model. Please check your configuration.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <AdminLayout title="AI Model Management"><LoadingSpinner message="Loading configuration..." /></AdminLayout>;

  return (
    <AdminLayout title="AI Model Management">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>AI Model Management</Typography>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Current Model Settings */}
          <Grid item xs={12} md={6}>
            <CustomCard title="Model Configuration" subtitle="Configure AI model parameters">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>AI Model</InputLabel>
                  <Select
                    value={config.model}
                    label="AI Model"
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  >
                    <MenuItem value="gpt-4">GPT-4 (Most Capable)</MenuItem>
                    <MenuItem value="gpt-4-turbo">GPT-4 Turbo (Faster)</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Cost Effective)</MenuItem>
                    <MenuItem value="claude-3">Claude 3</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography gutterBottom>Temperature: {config.temperature}</Typography>
                  <Slider
                    value={config.temperature}
                    onChange={(e, value) => setConfig({ ...config, temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Controls randomness. Lower is more focused, higher is more creative.
                  </Typography>
                </Box>

                <Box>
                  <Typography gutterBottom>Max Tokens: {config.maxTokens}</Typography>
                  <Slider
                    value={config.maxTokens}
                    onChange={(e, value) => setConfig({ ...config, maxTokens: value })}
                    min={100}
                    max={4000}
                    step={100}
                    marks
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum length of the generated response.
                  </Typography>
                </Box>

                <Box>
                  <Typography gutterBottom>Top P: {config.topP}</Typography>
                  <Slider
                    value={config.topP}
                    onChange={(e, value) => setConfig({ ...config, topP: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Frequency Penalty: {config.frequencyPenalty}</Typography>
                  <Slider
                    value={config.frequencyPenalty}
                    onChange={(e, value) => setConfig({ ...config, frequencyPenalty: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Presence Penalty: {config.presencePenalty}</Typography>
                  <Slider
                    value={config.presencePenalty}
                    onChange={(e, value) => setConfig({ ...config, presencePenalty: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Box>
            </CustomCard>
          </Grid>

          {/* Prompt Templates */}
          <Grid item xs={12} md={6}>
            <CustomCard title="Prompt Templates" subtitle="Customize evaluation prompts">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Essay Prompt Template"
                  multiline
                  rows={4}
                  value={promptTemplates.essay}
                  onChange={(e) => setPromptTemplates({ ...promptTemplates, essay: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Code Prompt Template"
                  multiline
                  rows={4}
                  value={promptTemplates.code}
                  onChange={(e) => setPromptTemplates({ ...promptTemplates, code: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Math Prompt Template"
                  multiline
                  rows={4}
                  value={promptTemplates.math}
                  onChange={(e) => setPromptTemplates({ ...promptTemplates, math: e.target.value })}
                  fullWidth
                />
              </Box>
            </CustomCard>
          </Grid>

          {/* Model Testing */}
          <Grid item xs={12}>
            <CustomCard title="Test Model Interface" subtitle="Test your AI model configuration">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Test Input"
                    multiline
                    rows={8}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    fullWidth
                    placeholder="Enter text to evaluate..."
                  />
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleTestModel}
                    disabled={!testInput || testing}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {testing ? 'Testing...' : 'Test Model'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      minHeight: 240,
                      maxHeight: 280,
                      overflow: 'auto',
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Model Output:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testOutput || 'Output will appear here...'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CustomCard>
          </Grid>

          {/* Model Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Model Statistics</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">1,247</Typography>
                      <Typography variant="body2" color="text.secondary">Total Evaluations</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">2.3s</Typography>
                      <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">98.5%</Typography>
                      <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip label="Active" color="success" />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Model Status</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default AIModelManagement;
