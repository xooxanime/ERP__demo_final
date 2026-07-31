import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, FileImage, Video, Music, Archive, FileSpreadsheet, 
  Upload, X, RefreshCw, CheckCircle, AlertCircle, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getFileUrl, openOrDownloadFile } from '../../lib/utils';

const getFileDetails = (fileName) => {
  if (!fileName) return { Icon: FileText, color: 'text-slate-500 bg-slate-500/10', extLabel: 'File' };
  const ext = fileName.split('.').pop().toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return { Icon: FileText, color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/5', extLabel: 'PDF' };
    case 'doc':
    case 'docx':
      return { Icon: FileText, color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/5', extLabel: 'Word' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { Icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5', extLabel: 'Excel' };
    case 'ppt':
    case 'pptx':
      return { Icon: FileSpreadsheet, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/5', extLabel: 'PowerPoint' };
    case 'mp4':
    case 'mkv':
    case 'webm':
    case 'avi':
    case 'mov':
      return { Icon: Video, color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/5', extLabel: 'Video' };
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'm4a':
      return { Icon: Music, color: 'text-pink-500 bg-pink-500/10 dark:bg-pink-500/5', extLabel: 'Audio' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { Icon: Archive, color: 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5', extLabel: 'Archive' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'gif':
      return { Icon: FileImage, color: 'text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/5', extLabel: 'Image' };
    default:
      return { Icon: FileText, color: 'text-slate-500 bg-slate-500/10 dark:bg-slate-500/5', extLabel: ext.toUpperCase() };
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload = ({
  onChange, // triggers when files are selected/changed (passes simulated input event)
  multiple = false,
  accept = '*/*',
  maxSize = 15 * 1024 * 1024, // 15MB default
  maxFiles = 10,
  disabled = false,
  uploadUrl = null, // if specified, will manage its own upload state
  onUploadSuccess = null,
  onUploadError = null,
  onRemove = null,
  files = [], // Current files list in parent: Array of File objects or { name, size, url, publicId }
  uploading = false, // controlled loading state if uploadUrl is null
  progress = 0, // controlled progress if uploadUrl is null
  dragLabel = "Drag & drop files here, or click to browse",
  acceptLabel = "Supports documents, images, videos or archives",
  enableDragDrop = true,
  showPreview = true
}) => {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [localUploadState, setLocalUploadState] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'failed'
  const [localProgress, setLocalProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]); // Raw File objects selected locally

  useEffect(() => {
    // Keep local selection state clean when files are cleared from parent
    if (files.length === 0) {
      setSelectedFiles([]);
      if (localUploadState !== 'idle') setLocalUploadState('idle');
    }
  }, [files]);

  const handleDrag = (e) => {
    if (!enableDragDrop || disabled || uploading || localUploadState === 'uploading') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    if (!enableDragDrop || disabled || uploading || localUploadState === 'uploading') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const validateAndProcessFiles = (fileList) => {
    const validFiles = [];
    const countLimit = multiple ? maxFiles : 1;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check file size
      if (file.size === 0) {
        toast.error(`File "${file.name}" is empty or corrupted.`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds the maximum limit of ${formatFileSize(maxSize)}.`);
        continue;
      }

      // Check file type
      if (accept !== '*/*') {
        const acceptTypes = accept.split(',').map(t => t.trim());
        const fileType = file.type;
        const fileName = file.name;

        const isAccepted = acceptTypes.some(type => {
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(baseType + '/');
          }
          if (type.startsWith('.')) {
            return fileName.toLowerCase().endsWith(type.toLowerCase());
          }
          return fileType === type;
        });

        if (!isAccepted) {
          toast.error(`File "${file.name}" has an unsupported format.`);
          continue;
        }
      }

      validFiles.push(file);
      if (validFiles.length >= countLimit) break;
    }

    if (validFiles.length > 0) {
      const newFileList = multiple ? [...selectedFiles, ...validFiles].slice(0, maxFiles) : validFiles;
      setSelectedFiles(newFileList);

      // Trigger change callback for parent
      if (onChange) {
        onChange({
          target: {
            files: newFileList
          }
        });
      }

      // Trigger automatic sequential upload if uploadUrl is provided
      if (uploadUrl) {
        uploadSequentially(newFileList);
      }
    }
  };

  const uploadSequentially = async (pendingFiles) => {
    setLocalUploadState('uploading');
    setLocalProgress(0);
    const token = localStorage.getItem('token');
    const uploadedResults = [];

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const targetEndpoint = uploadUrl.startsWith('http') 
          ? uploadUrl 
          : `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${uploadUrl.startsWith('/') ? '' : '/'}${uploadUrl}`;

        const res = await axios.post(
          targetEndpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const currentPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const totalPercent = Math.round(((i * 100) + currentPercent) / pendingFiles.length);
              setLocalProgress(totalPercent);
            }
          }
        );

        if (res.data.status === 'success') {
          uploadedResults.push(res.data.data);
        } else {
          throw new Error(res.data.message || 'Upload failed');
        }
      }

      setLocalUploadState('success');
      toast.success('Upload completed successfully!');
      if (onUploadSuccess) {
        onUploadSuccess(uploadedResults);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setLocalUploadState('failed');
      toast.error(error.response?.data?.message || 'Failed to upload files.');
      if (onUploadError) {
        onUploadError(error);
      }
    }
  };

  const retryUpload = () => {
    if (selectedFiles.length > 0 && uploadUrl) {
      uploadSequentially(selectedFiles);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setSelectedFiles([]);
    setLocalUploadState('idle');
    setLocalProgress(0);
    if (onChange) {
      onChange({ target: { files: [] } });
    }
    if (onRemove) {
      onRemove(-1); // special indicator to clear all in parent
    }
  };

  const triggerFileSelect = () => {
    if (!disabled && !uploading && localUploadState !== 'uploading') {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      triggerFileSelect();
    }
  };

  const isUploading = uploading || localUploadState === 'uploading';
  const showProgress = isUploading && (progress > 0 || localProgress > 0);
  const currentProgress = uploadUrl ? localProgress : progress;

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        tabIndex={disabled || isUploading ? -1 : 0}
        role="button"
        aria-label={dragLabel}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
          isDragActive 
            ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]' 
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/60'
        } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || isUploading}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-slate-500 font-bold">Uploading file(s)...</span>
          </div>
        ) : (
          <>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-205">{dragLabel}</p>
            <p className="text-[10px] text-slate-400 mt-1">{acceptLabel}</p>
          </>
        )}
      </div>

      {/* Progress Bar Container */}
      {showProgress && (
        <div className="space-y-1.5 p-3 border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 rounded-xl">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Uploading in progress...
            </span>
            <span>{currentProgress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success/Error State UI (Self-managed only) */}
      {uploadUrl && localUploadState === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4" /> Upload completed successfully!
        </div>
      )}

      {uploadUrl && localUploadState === 'failed' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Upload failed. Please check file type and try again.
          </div>
          <button 
            type="button" 
            onClick={retryUpload}
            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold transition-all self-end sm:self-auto shadow-sm"
          >
            Retry Upload
          </button>
        </div>
      )}

      {/* Selected Previews / Uploaded List */}
      {showPreview && files && files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Files ({files.length})</span>
            <button 
              type="button" 
              onClick={clearAll} 
              disabled={isUploading}
              className="text-[10px] font-bold text-rose-500 hover:underline hover:text-rose-600 disabled:opacity-50 disabled:no-underline"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file, idx) => {
              const isRawFile = file instanceof File;
              const name = isRawFile ? file.name : (file.name || file.title || 'Resource File');
              const size = isRawFile ? file.size : file.size;
              const rawUrl = isRawFile ? null : (file.url || file.fileUrl || (typeof file === 'string' ? file : null));
              
              const { Icon, color, extLabel } = getFileDetails(name);
              const ext = name.split('.').pop().toLowerCase();
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
              
              let targetUrl = null;
              if (isRawFile) {
                try { targetUrl = URL.createObjectURL(file); } catch(e) {}
              } else if (rawUrl) {
                targetUrl = getFileUrl(rawUrl);
              }

              const handlePreviewClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const success = openOrDownloadFile(targetUrl || rawUrl || file, name);
                if (!success) {
                  toast.error('File preview URL is not available.');
                }
              };

              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-xl text-xs gap-3 shadow-sm hover:border-primary/40 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail or File Type Icon */}
                    {isImage && targetUrl ? (
                      <img 
                        src={targetUrl} 
                        alt="Preview" 
                        className="w-9 h-9 object-cover rounded-lg bg-muted border border-border shrink-0" 
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">{name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 font-semibold">
                        {extLabel} {size ? `• ${formatFileSize(size)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {targetUrl && (
                      <button 
                        type="button"
                        onClick={handlePreviewClick}
                        className="p-1.5 text-muted-foreground hover:text-primary bg-muted/50 hover:bg-primary/10 rounded-lg transition-colors"
                        title="Preview / Download file"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(idx);
                        }}
                        disabled={isUploading}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
