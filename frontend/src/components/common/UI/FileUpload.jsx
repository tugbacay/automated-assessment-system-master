import { useState } from 'react';
import { Box, Button, Typography, IconButton, LinearProgress } from '@mui/material';
import { CloudUpload as UploadIcon, Close as CloseIcon } from '@mui/icons-material';

/**
 * FileUpload Component
 * File upload component with drag and drop support
 */
const FileUpload = ({
  accept = '*/*',
  maxSize = 10485760, // 10MB default
  onFileSelect,
  label = 'Upload File',
  helperText = 'Click or drag file to upload',
}) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (selectedFile) => {
    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1048576).toFixed(1)}MB`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      onFileSelect?.(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      onFileSelect?.(droppedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    onFileSelect?.(null);
  };

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload-input"
      />
      <label htmlFor="file-upload-input">
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : error ? 'error.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? 'action.hover' : 'transparent',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {helperText}
          </Typography>
        </Box>
      </label>

      {file && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="body2">{file.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1048576).toFixed(2)} MB
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleRemove}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
