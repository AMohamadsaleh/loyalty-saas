'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
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
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {t.nav.langToggle}
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isSignUp ? t.login.createAccount : t.login.welcomeBack}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSignUp ? t.login.startLoyalty : t.login.signInToStore}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t.login.storeName}
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t.login.storeNamePlaceholder}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t.login.email}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t.login.password}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
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
            {loading ? t.login.pleaseWait : isSignUp ? t.login.createBtn : t.login.signInBtn}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setStoreName(''); }}
          className="mt-4 w-full text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          {isSignUp ? t.login.haveAccount : t.login.noAccount}
        </button>
      </div>
    </div>
  );
}
