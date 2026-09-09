import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Props {
  onLoginSuccess: (user: { email: string; role: string }) => void;
}

export const AdminLoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data?.user) {
        onLoginSuccess({ email: data.user.email || email, role: data.user.user_metadata?.role || 'Store Owner' });
        return;
      }

      setError(authError?.message || 'Invalid credentials. Check your email and password.');
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl p-6 space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg mx-auto flex items-center justify-center text-white font-semibold text-base">
            KV
          </div>
          <h1 className="text-xl font-semibold text-white">KuyaVince POS</h1>
          <p className="text-xs text-slate-400">Multi-Branch Admin Portal</p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Supabase Authentication</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kuyavincepos.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Zamboanga City Multi-Branch Hub
          </p>
        </div>
      </div>
    </div>
  );
};
