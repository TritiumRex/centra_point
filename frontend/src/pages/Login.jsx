import React, { useState } from 'react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/token/', {
        username: email,
        password: password,
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      window.location.href = '/admin';
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 border border-gray-700 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-2">centra_point</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to continue</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded text-gray-100 placeholder-gray-500 mb-4 focus:outline-none focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded text-gray-100 placeholder-gray-500 mb-6 focus:outline-none focus:border-blue-500"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition-colors">
          Sign In
        </button>
      </form>
    </div>
  );
}
