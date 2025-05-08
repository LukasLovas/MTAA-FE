import axios, { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

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

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);
