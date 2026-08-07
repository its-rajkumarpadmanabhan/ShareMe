import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import Card from "../components/Card";
import GridCard from "../components/GridCard";
import dayjs from "dayjs";
import { Mail, Edit2, X, Send, Trash2, Heart, MessageSquare, Download } from "lucide-react";
import "./Home.css";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Preview state
  const [previewPost, setPreviewPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  
  // Edit form state
  const [socialLinks, setSocialLinks] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  // Post edit state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get(`/users/${id}/profile/`);
      setProfile(response.data);
      setSocialLinks(response.data.social_media_links || "");
      setCollabEmail(response.data.collab_email || "");
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get(`/posts/?user_id=${id}`);
      setPosts(response.data);
      if (previewPost) {
        const updatedPost = response.data.find(p => p.id === previewPost.id);
        if (updatedPost) setPreviewPost(updatedPost);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return navigate('/login');
    try {
      await axiosInstance.post(`/users/${id}/follow/`);
      fetchProfile();
    } catch (err) {
      console.error("Failed to follow/unfollow", err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (profilePic) formData.append('profile_pic', profilePic);
    formData.append('social_media_links', socialLinks);
    formData.append('collab_email', collabEmail);

    try {
      await axiosInstance.patch(`/users/${id}/profile/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await axiosInstance.delete(`/posts/${postId}/`);
        fetchPosts(); // Refresh list after deletion
        if (previewPost && previewPost.id === postId) setPreviewPost(null);
      } catch (err) {
        console.error("Failed to delete post", err);
      }
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

  const renderPreviewMedia = (fileUrl) => {
    const cleanUrl = fileUrl.split('?')[0].replace(/\/$/, "");
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    const ext = match ? match[1].toLowerCase() : '';
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://127.0.0.1:8000${fileUrl}`;
    
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
      }
      setIsUploadOpen(false);
      setTitle("");
      setDesc("");
      setFile(null);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  if (!profile) return <div className="page-content">Loading profile...</div>;

  const isOwnProfile = user && String(user.id) === String(id);

  return (
    <div className="home-container">
      <div className="home-header" style={{flexDirection: 'row', alignItems: 'center', gap: '2rem', padding: '2rem', background: 'var(--card-bg)', borderRadius: '16px'}}>
        <div className="profile-pic-container">
          {profile.profile_pic ? (
            <img src={profile.profile_pic} alt="Profile" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover'}} />
          ) : (
            <div style={{width: '120px', height: '120px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold'}}>
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div style={{flex: 1}}>
          <h1 style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>{profile.username}</h1>
          <div style={{display: 'flex', gap: '1.5rem', marginBottom: '1rem'}}>
            <span><strong style={{color: 'var(--accent-color)'}}>{profile.followers_count}</strong> Followers</span>
            <span><strong style={{color: 'var(--accent-color)'}}>{profile.following_count}</strong> Following</span>
            <span><strong style={{color: 'var(--accent-color)'}}>{posts.length}</strong> Posts</span>
          </div>
          
          {profile.collab_email && (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>
              <Mail size={16} /> {profile.collab_email}
            </div>
          )}
          {profile.social_media_links && (
            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
              <strong>Socials:</strong> {profile.social_media_links}
            </div>
          )}
        </div>
        
        <div>
          {isOwnProfile ? (
            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} style={{marginRight: '0.5rem'}} /> Edit Profile
            </button>
          ) : (
            <button className={profile.is_following ? "btn-secondary" : "btn-primary"} onClick={handleFollowToggle}>
              {profile.is_following ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <h2 style={{marginTop: '2rem', marginBottom: '1rem'}}>Uploaded Posts</h2>
      <div className="profile-grid">
        {posts.map((post) => (
          <GridCard 
            key={post.id} 
            post={post} 
            onPreview={setPreviewPost}
          />
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="empty-state">
          <h3>No posts yet</h3>
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
                  {user && String(user.id) !== String(previewPost.uploaded_by.id) && !previewPost.collaborators?.some(c => String(c.id) === String(user.id)) && (
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

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Profile Picture</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setProfilePic(e.target.files[0])}
                style={{marginBottom: '1rem', width: '100%'}}
              />
              
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Collaboration Email</label>
              <input 
                type="email" 
                className="input-field"
                placeholder="Email for collab requests" 
                value={collabEmail}
                onChange={e => setCollabEmail(e.target.value)}
              />
              
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Social Media Links</label>
              <textarea 
                className="input-field"
                placeholder="Your links..." 
                rows="3"
                value={socialLinks}
                onChange={e => setSocialLinks(e.target.value)}
              ></textarea>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isUploadOpen && (
        <div className="modal-overlay" onClick={() => { setIsUploadOpen(false); setEditingPost(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit File Details</h2>
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
                onChange={e => setFile(e.target.files[0])}
                style={{marginBottom: '1rem', width: '100%'}}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsUploadOpen(false); setEditingPost(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
