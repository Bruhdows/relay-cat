import React, { useEffect, useReducer, ReactNode } from 'react';
import { AxiosError } from 'axios';
import { AuthContext, AuthState, AuthAction } from './AuthContextValue';
import * as api from '../services/api';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};



export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      if (state.token) {
        try {
          const user = await api.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
          console.error('Auth init error:', error);
          dispatch({ type: 'LOGOUT' });
        }
      }
    };

    initAuth();
  }, [state.token]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      dispatch({ type: 'LOGIN_FAILURE', payload: (axiosError.response?.data as { message?: string })?.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.register(username, email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      dispatch({ type: 'LOGIN_FAILURE', payload: (axiosError.response?.data as { message?: string })?.message || 'Registration failed' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
