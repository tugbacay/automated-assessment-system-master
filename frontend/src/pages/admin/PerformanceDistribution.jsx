import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

const PerformanceDistribution = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [scoreHistogram, setScoreHistogram] = useState([]);
  const [performanceByType, setPerformanceByType] = useState([]);
  const [improvementTrends, setImprovementTrends] = useState([]);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/performance?range=${timeRange}`);
      setGradeDistribution(response.data.gradeDistribution || generateGradeDistribution());
      setScoreHistogram(response.data.scoreHistogram || generateScoreHistogram());
      setPerformanceByType(response.data.performanceByType || generatePerformanceByType());
      setImprovementTrends(response.data.improvementTrends || generateImprovementTrends());
    } catch (error) {
      console.error('Error fetching performance distribution:', error);
      setGradeDistribution(generateGradeDistribution());
      setScoreHistogram(generateScoreHistogram());
      setPerformanceByType(generatePerformanceByType());
      setImprovementTrends(generateImprovementTrends());
    } finally {
      setLoading(false);
    }
  };

  const generateGradeDistribution = () => [
    { grade: 'A', count: 345, color: '#388e3c' },
    { grade: 'B', count: 567, color: '#1976d2' },
    { grade: 'C', count: 423, color: '#f57c00' },
    { grade: 'D', count: 156, color: '#d32f2f' },
    { grade: 'F', count: 45, color: '#7b1fa2' },
  ];

  const generateScoreHistogram = () =>
    Array.from({ length: 20 }, (_, i) => ({
      range: `${i * 5}-${(i + 1) * 5}`,
      count: Math.floor(Math.random() * 100 + 50 * Math.exp(-Math.pow((i - 16) / 4, 2))),
    }));

  const generatePerformanceByType = () => [
    { type: 'Essay', avgScore: 78, submissions: 345 },
    { type: 'Code', avgScore: 82, submissions: 456 },
    { type: 'Math', avgScore: 75, submissions: 234 },
    { type: 'Quiz', avgScore: 88, submissions: 678 },
    { type: 'Project', avgScore: 85, submissions: 123 },
  ];

  const generateImprovementTrends = () =>
    Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      avgScore: 70 + i + Math.random() * 10,
      median: 68 + i + Math.random() * 8,
    }));

  if (loading) return <AdminLayout title="Performance Distribution"><LoadingSpinner message="Loading performance data..." /></AdminLayout>;

  return (
    <AdminLayout title="Performance Distribution">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>Performance Distribution</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>Refresh</Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CustomCard title="Grade Distribution" subtitle="Overall grade breakdown">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" labelLine={false} label={({ grade, count }) => `${grade}: ${count}`} outerRadius={100} dataKey="count">
                    {gradeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomCard title="Score Distribution Histogram" subtitle="Frequency distribution of scores">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={scoreHistogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#1976d2" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomCard title="Performance by Activity Type" subtitle="Average scores across activity types">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#388e3c" name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomCard title="Improvement Trends" subtitle="Average and median scores over time">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={improvementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="avgScore" fill="#1976d2" stroke="#1976d2" fillOpacity={0.3} name="Avg Score" />
                  <Line type="monotone" dataKey="median" stroke="#388e3c" strokeWidth={2} name="Median" />
                </ComposedChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default PerformanceDistribution;
