import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseURL = 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use(async req => {
  let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

  if (!authTokens) {
    return req;
  }

  const user = jwtDecode(authTokens.access);
  const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

  if (!isExpired) {
    req.headers.Authorization = `Bearer ${authTokens.access}`;
    return req;
  }

  try {
    const response = await axios.post(`${baseURL}/auth/refresh/`, {
      refresh: authTokens.refresh
    });

    localStorage.setItem('authTokens', JSON.stringify(response.data));
    req.headers.Authorization = `Bearer ${response.data.access}`;
  } catch (error) {
    console.error('Refresh token failed:', error);
    localStorage.removeItem('authTokens');
    // We shouldn't forcefully redirect here because public pages like Home
    // still need to load even if the user's session expired.
    // Let the AuthContext handle the user state update on reload.
  }

  return req;
});

export default axiosInstance;
