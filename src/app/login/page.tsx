'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let credential;
      if (isSignUp) {
        credential = await createUserWithEmailAndPassword(getClientAuth(), email, password);
        const idToken = await credential.user.getIdToken();
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, name: storeName.trim() || email.split('@')[0] }),
        });
        if (!res.ok) throw new Error('Account setup failed');
      } else {
        credential = await signInWithEmailAndPassword(getClientAuth(), email, password);
        document.cookie = `auth=1; path=/; max-age=${60 * 60 * 24 * 5}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
      }

      router.replace('/scan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSignUp ? 'Start your loyalty program' : 'Sign in to your store'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Store name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setStoreName(''); }}
          className="mt-4 w-full text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
