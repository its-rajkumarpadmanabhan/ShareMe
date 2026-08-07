import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon, Search, Upload, LogOut, LayoutDashboard, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">ShareMe</Link>
      </div>

      <div className="nav-actions">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {user ? (
          <>
            <button className="icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">
              <LayoutDashboard size={20} />
            </button>
            <button className="icon-btn" onClick={() => navigate(`/profile/${user.id}`)} title="Profile">
              <User size={20} />
            </button>
            <button className="icon-btn" onClick={() => {}} title="Upload File">
              <Upload size={20} />
            </button>
            <button className="icon-btn logout-btn" onClick={logoutUser} title="Logout">
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
