import React from "react";
import { Heart, MessageSquare } from "lucide-react";
import "./GridCard.css";

export default function GridCard({ post, onPreview }) {
  const cleanFile = post.file.split('?')[0];
  const isImage = cleanFile.match(/\.(jpeg|jpg|gif|png|webp|jfif|svg|avif)$/i) != null;
  const isVideo = cleanFile.match(/\.(mp4|webm|ogg)$/i) != null;
  const fileExt = cleanFile.split('.').pop().toUpperCase();
  
  const fullFileUrl = post.file.startsWith('http') ? post.file : `http://127.0.0.1:8000${post.file}`;

  return (
    <div className="grid-card" onClick={() => onPreview(post)}>
      {isImage ? (
        <img src={fullFileUrl} alt="Post" className="grid-card-media" />
      ) : isVideo ? (
        <video src={fullFileUrl} className="grid-card-media" muted playsInline />
      ) : (
        <div className="grid-card-document">
          <span>.{fileExt}</span>
        </div>
      )}
      
      <div className="grid-card-overlay">
        <div className="overlay-stats">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Heart fill="white" size={20} /> {post.likes_count}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MessageSquare fill="white" size={20} /> {post.comments?.length || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
