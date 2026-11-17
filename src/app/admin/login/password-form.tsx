'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPicoreBrowserClient } from '@/lib/picore/client';

// Same wording whether the email or the password is wrong (does not reveal which accounts exist).
const SAFE_LOGIN_ERROR = 'Email atau kata sandi salah.';

/** Password login with a PI-CORE account; the page then decides access (my_app_roles). */
export function PasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: signInError } = await createPicoreBrowserClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(SAFE_LOGIN_ERROR);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Gagal masuk. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full rounded-xl border border-brown-300 bg-white px-4 py-3 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-400';
  return (
    <form onSubmit={submit} className="space-y-3 text-left" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <label className="block text-sm font-semibold text-brown-800">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email akun PI-CORE"
          className={`${field} mt-1.5`}
        />
      </label>
      <label className="block text-sm font-semibold text-brown-800">
        Kata sandi
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${field} mt-1.5`}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brown-800 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brown-900 disabled:opacity-60"
      >
        {busy ? 'Memproses…' : 'Masuk'}
      </button>
    </form>
  );
}
