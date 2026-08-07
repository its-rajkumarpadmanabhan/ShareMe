import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );

  useEffect(() => {
    if (authTokens) {
      const decoded = jwtDecode(authTokens.access);
      if (decoded.user_id && !decoded.id) decoded.id = decoded.user_id;
      setUser(decoded);
    }
  }, [authTokens]);

  const loginUser = async (username, password) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
        username,
        password,
      });
      if (response.status === 200) {
        setAuthTokens(response.data);
        const decoded = jwtDecode(response.data.access);
        if (decoded.user_id && !decoded.id) decoded.id = decoded.user_id;
        setUser(decoded);
        localStorage.setItem('authTokens', JSON.stringify(response.data));
        return true;
      }
    } catch (error) {
      console.error('Login error', error);
      return false;
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};
