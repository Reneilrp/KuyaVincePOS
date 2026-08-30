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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 text-white font-bold text-2xl">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">KuyaVince POS</h1>
          <p className="text-xs text-slate-400">Multi-Branch Admin Cloud Management Portal</p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Supabase Cloud Database Authentication</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kuyavincepos.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              New admin? Create your account in the{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Supabase Dashboard</a>{' '}
              under Authentication → Users.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Zamboanga City Multi-Branch Hub • 100% Free Serverless Cloud
          </p>
        </div>
      </div>
    </div>
  );
};
