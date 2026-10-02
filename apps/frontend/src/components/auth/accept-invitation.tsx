'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export function AcceptInvitation({ email, organizationName }: { email: string; organizationName: string }) {
  const fetchData = useFetch();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetchData('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password: data.get('password'), company: 'Invited member', provider: 'LOCAL', providerToken: '' }),
      });
      if (!response.ok) {
        setError(await response.text());
        return;
      }
      router.push(response.headers.get('activate') === 'true' ? '/auth/activate' : '/');
    } catch {
      setError('Unable to create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5 w-full">
      <h1 className="text-3xl font-semibold">Join {organizationName}</h1>
      <p>Create your Anove Social account with the email address that was invited.</p>
      <label className="flex flex-col gap-2">Email
        <input name="email" type="email" value={email} readOnly autoComplete="username" className="rounded-lg p-3 bg-transparent border border-current" />
      </label>
      <label className="flex flex-col gap-2">Choose a password
        <input name="password" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className="rounded-lg p-3 bg-transparent border border-current" />
        <span className="text-sm">Use at least 12 characters.</span>
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg p-3 bg-white text-black disabled:opacity-50">{busy ? 'Creating account…' : 'Create account and join'}</button>
      <p className="text-sm">Already have an account? <Link className="underline" href="/auth/login">Sign in with {email}</Link>.</p>
      <p className="text-sm">After creating your account, check your email for the activation link. If it does not arrive, <Link className="underline" href="/auth/activate">resend it here</Link>.</p>
    </form>
  );
}
