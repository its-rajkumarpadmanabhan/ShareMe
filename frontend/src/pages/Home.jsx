import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Heart, MessageSquare, Download, Edit2, Trash2, Plus, Search, X, Send } from "lucide-react";
import "./Home.css";

import Card from "../components/Card";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    // Add debounce for search
    const delayDebounceFn = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get(`/posts/?search=${search}`);
      setPosts(response.data);
      // Update previewPost if it's currently open to get new comments/likes
      if (previewPost) {
        const updatedPost = response.data.find(p => p.id === previewPost.id);
        if (updatedPost) setPreviewPost(updatedPost);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return navigate('/login');
    try {
      await axiosInstance.post(`/posts/${postId}/like/`);
      fetchPosts();
    } catch (err) {
      console.error("Failed to like", err);
    }
  };

  const handleDownload = async (postId, fileUrl) => {
    if (!user) return navigate('/login');
    try {
      const response = await axiosInstance.get(`/posts/${postId}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileUrl.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      fetchPosts();
    } catch (err) {
      console.error("Failed to download", err);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await axiosInstance.delete(`/posts/${postId}/`);
        fetchPosts();
        if (previewPost && previewPost.id === postId) setPreviewPost(null);
      } catch (err) {
        console.error("Failed to delete post", err);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!commentText.trim() || !previewPost) return;
    
    try {
      await axiosInstance.post(`/posts/${previewPost.id}/comment/`, { text: commentText });
      setCommentText("");
      fetchPosts();
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleCollabRequest = async (postId) => {
    if (!user) return navigate('/login');
    try {
      const response = await axiosInstance.post(`/posts/${postId}/collab/request/`);
      alert(response.data.message);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send collaboration request");
    }
  };

  const handleCollabRespond = async (postId, userId, action) => {
    try {
      await axiosInstance.post(`/posts/${postId}/collab/respond/`, { user_id: userId, action });
      fetchPosts();
      
      // Update local preview state to reflect the change immediately
      if (previewPost && previewPost.id === postId) {
        const req = previewPost.pending_collab_requests.find(r => r.user.id === userId);
        setPreviewPost({
          ...previewPost,
          pending_collab_requests: previewPost.pending_collab_requests.filter(r => r.user.id !== userId),
          collaborators: action === 'accept' ? [...(previewPost.collaborators || []), req.user] : previewPost.collaborators
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to respond");
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setDesc(post.description);
    setFile(null);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file && !editingPost) return;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    if (file) formData.append('file', file);
    
    try {
      if (editingPost) {
        await axiosInstance.patch(`/posts/${editingPost.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axiosInstance.post('/posts/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsUploadOpen(false);
      setTitle("");
      setDesc("");
      setFile(null);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error("Upload/Edit failed", err);
    }
  };

  // Helper to render media in preview
  const renderPreviewMedia = (fileUrl) => {
    const cleanUrl = fileUrl.split('?')[0].replace(/\/$/, ""); // remove query params and trailing slash
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    const ext = match ? match[1].toLowerCase() : '';
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://127.0.0.1:8000${fileUrl}`;
    
    // Only show visual preview for supported files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'svg', 'avif'].includes(ext)) {
      return <img src={fullUrl} alt="Preview" />;
    } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
      return <video src={fullUrl} controls controlsList="nodownload" style={{width: '100%', borderRadius: '8px'}} />;
    } else if (['pdf', 'txt', 'csv'].includes(ext)) {
      return <iframe src={`${fullUrl}${ext === 'pdf' ? '#toolbar=0' : ''}`} title="Document Preview" width="100%" height="100%" style={{border: 'none', background: 'white', borderRadius: '8px', minHeight: '500px'}} />;
    } else {
      return (
        <div style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
          <div style={{fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem'}}>.{ext.toUpperCase()}</div>
          <p>Preview not available for this file type.</p>
          <button className="btn-primary" onClick={() => handleDownload(previewPost.id, previewPost.file)} style={{marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '8px'}}>
            Download File
          </button>
        </div>
      );
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h1>Discover Files</h1>
          <p>Explore, share, and manage your documents safely.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ margin: 0, paddingLeft: '40px', width: '250px' }}
            />
          </div>
          {user ? (
            <button className="upload-trigger-btn" onClick={() => setIsUploadOpen(true)}>
              <Plus size={20} /> New Upload
            </button>
          ) : (
            <button className="upload-trigger-btn" onClick={() => navigate('/login')}>
              Login to Upload
            </button>
          )}
        </div>
      </div>

      <div className="feed-container">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            post={post} 
            onLike={handleLike} 
            onDownload={handleDownload}
            currentUser={user}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onPreview={setPreviewPost}
          />
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="empty-state">
          <h2>No post yet available</h2>
          <p>Be the first to upload and share something with the world.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="modal-overlay" onClick={() => setPreviewPost(null)}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <div>
                <h2 className="preview-title">{previewPost.title}</h2>
                <div className="preview-uploader" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <span style={{cursor: 'pointer'}} onClick={() => navigate(`/profile/${previewPost.uploaded_by.id}`)}>
                    Uploaded by <span style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{previewPost.uploaded_by.username}</span> on {dayjs(previewPost.created_at).format('MMM D, YYYY')}
                  </span>
                  {user && user.id !== previewPost.uploaded_by.id && !previewPost.collaborators?.some(c => c.id === user.id) && (
                    <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => handleCollabRequest(previewPost.id)}>
                      Request Collab
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }} onClick={() => handleDownload(previewPost.id, previewPost.file)}>
                  <Download size={14} /> Download {previewPost.download_count}
                </button>
                {user && (String(user.id) === String(previewPost.uploaded_by.id) || previewPost.collaborators?.some(c => String(c.id) === String(user.id))) && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }} onClick={() => { setPreviewPost(null); openEditModal(previewPost); }}><Edit2 size={14} /> Edit</button>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', color: 'red', borderColor: 'red' }} onClick={() => handleDelete(previewPost.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                )}
                <button className="close-btn" onClick={() => setPreviewPost(null)}><X size={20} /></button>
              </div>
            </div>
            
            <div className="preview-body">
              <div className="preview-media-container">
                {renderPreviewMedia(previewPost.file)}
              </div>
              
              <div className="preview-sidebar">
                <div className="preview-desc">
                  {previewPost.description || "No description provided."}
                </div>
                
                {user && String(user.id) === String(previewPost.uploaded_by.id) && previewPost.pending_collab_requests && previewPost.pending_collab_requests.length > 0 && (
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Pending Collab Requests ({previewPost.pending_collab_requests.length})</h4>
                    {previewPost.pending_collab_requests.map(req => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${req.user.id}`)}>
                          {req.user.profile_pic ? (
                            <img src={req.user.profile_pic} style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {req.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{fontWeight: 'bold', color: 'var(--text-primary)'}}>{req.user.username}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCollabRespond(previewPost.id, req.user.id, 'accept')}>Accept</button>
                          <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#dc3545', borderColor: '#dc3545' }} onClick={() => handleCollabRespond(previewPost.id, req.user.id, 'reject')}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="preview-comments">
                  <h4 style={{marginBottom: '0.5rem', color: 'var(--text-primary)'}}>Comments ({previewPost.comments.length})</h4>
                  {previewPost.comments.length === 0 ? (
                    <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>No comments yet. Be the first to share your thoughts!</p>
                  ) : (
                    previewPost.comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{comment.user.username}</span>
                          <span style={{color: 'var(--text-secondary)'}}>{dayjs(comment.created_at).format('MMM D')}</span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                    ))
                  )}
                </div>
                
                <form className="comment-input-area" onSubmit={handleCommentSubmit}>
                  <input 
                    type="text" 
                    placeholder={user ? "Write a comment..." : "Login to comment"} 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!user}
                  />
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{padding: '0.75rem', borderRadius: '50%'}}
                    disabled={!user || !commentText.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isUploadOpen && (
        <div className="modal-overlay" onClick={() => { setIsUploadOpen(false); setEditingPost(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingPost ? "Edit File Details" : "Upload a New File"}</h2>
            <form onSubmit={handleUploadSubmit}>
              <input 
                type="text" 
                className="input-field"
                placeholder="Title" 
                required 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea 
                className="input-field"
                placeholder="Description" 
                rows="4"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              ></textarea>
              <input 
                type="file" 
                required={!editingPost} 
                onChange={e => setFile(e.target.files[0])}
                style={{marginBottom: '1rem', width: '100%'}}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsUploadOpen(false); setEditingPost(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingPost ? "Save Changes" : "Upload File"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
