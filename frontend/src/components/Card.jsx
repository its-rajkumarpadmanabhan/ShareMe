import React from "react";
import dayjs from "dayjs";
import { Heart, MessageSquare, Download, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Card({ post, onLike, onDownload, currentUser, onEdit, onDelete, onPreview }) {
  const cleanFile = post.file.split('?')[0];
  const isImage = cleanFile.match(/\.(jpeg|jpg|gif|png|webp|jfif|svg|avif)$/i) != null;
  const isVideo = cleanFile.match(/\.(mp4|webm|ogg)$/i) != null;
  const fileExt = cleanFile.split('.').pop().toUpperCase();
  const isOwner = currentUser && currentUser.id === post.uploaded_by.id;
  const isCollaborator = currentUser && post.collaborators && post.collaborators.some(c => c.id === currentUser.id);
  const canEdit = isOwner || isCollaborator;
  const navigate = useNavigate();
  
  const fullFileUrl = post.file.startsWith('http') ? post.file : `http://127.0.0.1:8000${post.file}`;

  return (
    <article className="post-card" style={{ padding: '0', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.uploaded_by.id}`); }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[post.uploaded_by, ...(post.collaborators || [])].slice(0, 3).map((u, i) => (
              <div key={u.id} style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                marginLeft: i > 0 ? '-12px' : '0',
                border: '2px solid var(--bg-secondary)',
                position: 'relative',
                zIndex: 3 - i,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--accent-color), #5A0001)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'
              }}>
                {u.profile_pic ? (
                  <img src={u.profile_pic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  u.username.charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {[post.uploaded_by, ...(post.collaborators || [])].map(u => u.username).join(', ')}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {dayjs(post.created_at).format('MMM D')}</span>
        </div>
        
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ color: 'var(--accent-color)', background: 'transparent', padding: '0.25rem' }} onClick={(e) => { e.stopPropagation(); onEdit(post); }}><Edit2 size={16} /></button>
            <button style={{ color: '#dc3545', background: 'transparent', padding: '0.25rem' }} onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      {/* Media */}
      <div 
        style={{ width: '100%', minHeight: '300px', maxHeight: '600px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => onPreview(post)}
      >
        {isImage ? (
          <img src={fullFileUrl} alt="Post media" style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} />
        ) : isVideo ? (
          <video src={fullFileUrl} style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} muted playsInline />
        ) : (
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>.{fileExt}</span>
        )}
      </div>

      {/* Footer / Actions */}
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ cursor: 'pointer', color: post.has_liked ? '#dc3545' : 'var(--text-primary)', transition: 'transform 0.1s' }} onClick={() => onLike(post.id)}>
            <Heart size={24} fill={post.has_liked ? "#dc3545" : "none"} />
          </span>
          <span style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => onPreview(post)}>
            <MessageSquare size={24} />
          </span>
          <span style={{ cursor: 'pointer', color: 'var(--text-primary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '600' }} onClick={() => onDownload(post.id, post.file)}>
            <Download size={24} /> {post.download_count}
          </span>
        </div>

        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{post.uploaded_by.username}</span>
          {post.description || post.title}
        </div>

        {post.comments && post.comments.length > 0 && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => onPreview(post)}>
            View all {post.comments.length} comments
          </div>
        )}

      </div>
    </article>
  );
}
