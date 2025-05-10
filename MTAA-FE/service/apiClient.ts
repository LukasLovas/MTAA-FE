import axios, { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import {jwtDecode} from 'jwt-decode';

let getToken: () => string | null = () => null;
export const registerTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

export const api = axios.create({
  baseURL: 'http://10.10.14.76:8080',
});

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) (cfg.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
  return cfg;
});

interface JwtPayload {
  user_id: number;
}

export function getUserIdFromToken(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.user_id ?? null;
  } catch (e) {
    console.warn('Invalid JWT:', e);
    return null;
  }
}

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);
