import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { DownloadCloud } from "lucide-react";
import "./Home.css";

export default function Dashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/');
      setDownloads(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h1>Creator Dashboard</h1>
          <p>Analytics and insights on how your files are being used.</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -15px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem'}}>
          <DownloadCloud color="var(--accent-color)" /> Recent File Downloads
        </h3>
        
        {downloads.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {downloads.map((record) => (
              <div key={record.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'var(--bg-primary)', 
                padding: '1rem 1.5rem', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                transition: 'transform 0.2s'
              }}>
                <div>
                  <div style={{fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)'}}>{record.post_title}</div>
                  <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>
                    Downloaded by: <span style={{fontWeight: '600', color: 'var(--accent-color)'}}>{record.user?.username || 'Unknown'}</span>
                  </div>
                </div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500'}}>
                  {dayjs(record.downloaded_at).format('MMM D, YYYY • h:mm A')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{border: 'none', background: 'transparent'}}>
            <h2>No downloads yet.</h2>
            <p>Share your files to see who's downloading them!</p>
          </div>
        )}
      </div>
    </div>
  );
}
