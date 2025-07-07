import React, { useState } from 'react';
import API from '../utils/api';
import { LoginCredentials, LoginResponse } from '../types/auth';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await API.post<LoginResponse>('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      alert('Login Successful! Role: ' + res.data.role);
      // Navigate or update context based on role
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        name="username"
        placeholder="Username"
        className="w-full mb-4 p-3 border rounded"
        onChange={handleChange}
        value={formData.username}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        className="w-full mb-4 p-3 border rounded"
        onChange={handleChange}
        value={formData.password}
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
        Login
      </button>
    </form>
  );
};

export default LoginForm;
