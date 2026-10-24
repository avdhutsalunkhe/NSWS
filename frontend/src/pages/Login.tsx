import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your User ID or Plant Code.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ username: username.trim(), password });
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.jpeg"
            alt="RBPSSK Logo"
            className="w-24 h-24 object-contain rounded-2xl shadow-md border-2 border-slate-200 bg-white p-1"
          />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
          RBPSSK
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Rajarambapu Patil Sahakari Sakhar Karkhana Ltd.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          
          <div className="mb-6 pb-4 border-b border-slate-100 text-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your User ID and password to access the portal
            </p>
          </div>

          {error ? (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                User ID / Plant Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. admin or 101"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to RBPSSK'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-slate-400 font-medium">
          RBPSSK Directorate of Sugar & NSWS Gateway Integration | Secure System
        </p>
      </div>
    </div>
  );
};
