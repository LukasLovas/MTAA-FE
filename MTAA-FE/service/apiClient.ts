import axios, { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

let getToken: () => string | null = () => null;
export const registerTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

export const api = axios.create({
  baseURL: 'http://192.168.0.102:8080',
});

api.interceptors.request.use(
  async (cfg: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) (cfg.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    return cfg;
  },
  err => Promise.reject(err)
);

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);

interface JwtPayload {
  user_id: number;
}

export function getUserIdFromToken(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.user_id ?? null;
  } catch {
    return null;
  }
}
