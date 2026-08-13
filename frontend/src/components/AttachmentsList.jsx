import React, { useState, useEffect, useCallback } from 'react';
import { getFiles, uploadFile, downloadFile, deleteFile } from '../services/fileService';

const AttachmentsList = ({ entityType, entityId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFileList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFiles(entityType, entityId);
      if (res.success) {
        setFiles(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attached files');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityType && entityId) {
      fetchFileList();
    }
  }, [entityType, entityId, fetchFileList]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const res = await uploadFile(formData);
      if (res.success) {
        setSelectedFile(null);
        // Reset file input
        const inputEl = document.getElementById(`file-input-${entityType}-${entityId}`);
        if (inputEl) inputEl.value = '';
        await fetchFileList();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      await downloadFile(fileId, fileName);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      const res = await deleteFile(fileId);
      if (res.success) {
        await fetchFileList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File deletion failed');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#38bdf8' }}>
          📎 Attached Files
        </h3>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Upload Box */}
      <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          id={`file-input-${entityType}-${entityId}`}
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#cbd5e1',
            fontSize: '0.85rem'
          }}
        />
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          style={{
            padding: '8px 18px',
            background: selectedFile && !uploading ? '#3b82f6' : '#475569',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {/* Files List */}
      {loading ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          Loading attachments...
        </div>
      ) : files.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: '#0f172a', borderRadius: '8px', color: '#64748b', fontSize: '0.9rem' }}>
          No files attached yet. Upload documents, images, or PDFs up to 10MB.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <span style={{ fontSize: '1.3rem' }}>
                  {file.mimeType?.includes('pdf') ? '📄' : file.mimeType?.includes('image') ? '🖼️' : '📁'}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500, color: '#f1f5f9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                    {file.originalName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {formatBytes(file.size)} • Uploaded by {file.uploadedBy?.name || 'User'} on {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleDownload(file.id, file.originalName)}
                  style={{
                    padding: '6px 12px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentsList;
