import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  GetApp as GetAppIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

const AnalyticsExport = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    startDate: null,
    endDate: null,
    dataTypes: {
      users: true,
      submissions: true,
      analytics: false,
      auditLogs: false,
    },
  });

  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/export/history');
      setExportHistory(response.data || generateSampleHistory());
    } catch (error) {
      console.error('Error fetching export history:', error);
      setExportHistory(generateSampleHistory());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleHistory = () => {
    const formats = ['CSV', 'Excel', 'JSON', 'PDF'];
    const types = ['Users', 'Submissions', 'Analytics', 'Audit Logs', 'Complete Report'];
    const statuses = ['Completed', 'Completed', 'Completed', 'Failed'];

    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - i * 86400000 * Math.random() * 7).toLocaleString(),
      format: formats[Math.floor(Math.random() * formats.length)],
      dataType: types[Math.floor(Math.random() * types.length)],
      fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      downloadUrl: '#',
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const selectedTypes = Object.keys(exportConfig.dataTypes).filter(
        (key) => exportConfig.dataTypes[key]
      );

      if (selectedTypes.length === 0) {
        setSnackbar({ open: true, message: 'Please select at least one data type', severity: 'warning' });
        return;
      }

      const response = await api.post('/admin/analytics/export', {
        format: exportConfig.format,
        startDate: exportConfig.startDate,
        endDate: exportConfig.endDate,
        dataTypes: selectedTypes,
      });

      // Simulate download
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: 'Export completed successfully', severity: 'success' });
      fetchExportHistory();
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({ open: true, message: 'Export failed. Please try again.', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDataTypeChange = (type) => {
    setExportConfig({
      ...exportConfig,
      dataTypes: {
        ...exportConfig.dataTypes,
        [type]: !exportConfig.dataTypes[type],
      },
    });
  };

  const historyColumns = [
    { id: 'id', label: 'ID', minWidth: 70 },
    { id: 'date', label: 'Export Date', minWidth: 180 },
    { id: 'dataType', label: 'Data Type', minWidth: 150 },
    { id: 'format', label: 'Format', minWidth: 100 },
    { id: 'fileSize', label: 'File Size', minWidth: 100 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value}
          color={value === 'Completed' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      format: (value, row) => (
        <Button
          size="small"
          startIcon={<GetAppIcon />}
          disabled={row.status !== 'Completed'}
          onClick={() => window.open(row.downloadUrl, '_blank')}
        >
          Download
        </Button>
      ),
    },
  ];

  const formatIcons = {
    csv: <TableChartIcon />,
    excel: <TableChartIcon />,
    json: <DescriptionIcon />,
    pdf: <PictureAsPdfIcon />,
  };

  return (
    <AdminLayout title="Analytics Export">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Analytics Export
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Export Configuration */}
          <Grid item xs={12} md={5}>
            <CustomCard title="Export Configuration" subtitle="Configure your data export">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={exportConfig.startDate}
                    onChange={(newValue) =>
                      setExportConfig({ ...exportConfig, startDate: newValue })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />

                  <DatePicker
                    label="End Date"
                    value={exportConfig.endDate}
                    onChange={(newValue) =>
                      setExportConfig({ ...exportConfig, endDate: newValue })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>

                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportConfig.format}
                    label="Export Format"
                    onChange={(e) =>
                      setExportConfig({ ...exportConfig, format: e.target.value })
                    }
                  >
                    <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
                    <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="pdf">PDF Report</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Types to Export
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.dataTypes.users}
                          onChange={() => handleDataTypeChange('users')}
                        />
                      }
                      label="Users Data"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.dataTypes.submissions}
                          onChange={() => handleDataTypeChange('submissions')}
                        />
                      }
                      label="Submissions Data"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.dataTypes.analytics}
                          onChange={() => handleDataTypeChange('analytics')}
                        />
                      }
                      label="Analytics Data"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.dataTypes.auditLogs}
                          onChange={() => handleDataTypeChange('auditLogs')}
                        />
                      }
                      label="Audit Logs"
                    />
                  </FormGroup>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={exporting ? null : formatIcons[exportConfig.format]}
                  onClick={handleExport}
                  disabled={exporting}
                  fullWidth
                >
                  {exporting ? 'Exporting...' : 'Export Data'}
                </Button>

                {exportConfig.startDate && exportConfig.endDate && (
                  <Alert severity="info">
                    Exporting data from{' '}
                    {exportConfig.startDate.toLocaleDateString()} to{' '}
                    {exportConfig.endDate.toLocaleDateString()}
                  </Alert>
                )}
              </Box>
            </CustomCard>
          </Grid>

          {/* Quick Export Options */}
          <Grid item xs={12} md={7}>
            <CustomCard title="Quick Export Options" subtitle="Predefined export templates">
              <Grid container spacing={2}>
                {[
                  { title: 'Complete Report', desc: 'All data in PDF format', icon: <PictureAsPdfIcon /> },
                  { title: 'User List', desc: 'All users in CSV', icon: <TableChartIcon /> },
                  { title: 'Submissions', desc: 'All submissions in Excel', icon: <TableChartIcon /> },
                  { title: 'Audit Logs', desc: 'System logs in JSON', icon: <DescriptionIcon /> },
                ].map((option, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
                        },
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        // Quick export logic here
                        setSnackbar({
                          open: true,
                          message: `Exporting ${option.title}...`,
                          severity: 'info',
                        });
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ color: 'primary.main', mr: 1 }}>{option.icon}</Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {option.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {option.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CustomCard>
          </Grid>

          {/* Export History */}
          <Grid item xs={12}>
            <CustomCard
              title="Export History"
              subtitle="Previous exports and downloads"
            >
              <DataTable
                columns={historyColumns}
                rows={exportHistory}
                loading={loading}
                emptyMessage="No export history found"
                defaultRowsPerPage={10}
              />
            </CustomCard>
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

export default AnalyticsExport;
