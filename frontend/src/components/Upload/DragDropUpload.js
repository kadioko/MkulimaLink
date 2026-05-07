import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, File, AlertCircle } from 'lucide-react';

const DragDropUpload = ({
  onFilesSelected,
  onUpload,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  preview = true,
  uploadProgress = {},
}) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message),
      }));
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 5000);
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        preview: URL.createObjectURL(file),
        status: 'pending',
      }));

      setFiles(prev => {
        const combined = [...prev, ...newFiles];
        if (combined.length > maxFiles) {
          setErrors([{ file: 'multiple', errors: [`Maximum ${maxFiles} files allowed`] }]);
          return prev;
        }
        onFilesSelected?.(combined.map(f => f.file));
        return combined;
      });
    }
  }, [maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: maxFiles > 1,
  });

  const removeFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      onFilesSelected?.(filtered.map(f => f.file));
      return filtered;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    await onUpload?.(files.map(f => f.file));
  };

  return (
    <div className="w-full">
      {/* Dropzone */}
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <motion.div
          animate={isDragActive ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: isDragActive ? Infinity : 0, duration: 1 }}
        >
          <Upload 
            size={48} 
            className={`mx-auto mb-4 ${
              isDragActive ? 'text-green-500' : 'text-gray-400'
            }`} 
          />
        </motion.div>
        
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported: PNG, JPG, JPEG, WebP
        </p>
      </motion.div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="font-medium">Upload errors:</span>
            </div>
            <ul className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.map((err, idx) => (
                <li key={idx}>
                  {err.file}: {err.errors.join(', ')}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      {preview && files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selected files ({files.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {file.file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Progress */}
                  {uploadProgress[file.id] !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress[file.id]}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  
                  {/* File info */}
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Upload button */}
          {onUpload && (
            <motion.button
              onClick={handleUpload}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
