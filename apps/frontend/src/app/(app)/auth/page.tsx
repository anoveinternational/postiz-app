import { cookies } from 'next/headers';
import { AcceptInvitation } from '@gitroom/frontend/components/auth/accept-invitation';
import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
export const dynamic = 'force-dynamic';
import { Register } from '@gitroom/frontend/components/auth/register';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import Link from 'next/link';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import { LoginWithOidc } from '@gitroom/frontend/components/auth/login.with.oidc';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Anove Social' : 'Gitroom'} Register`,
  description: '',
};
export default async function Auth(params: {searchParams: Promise<{provider: string}>}) {
  const t = await getT();
  const inviteCookie = (await cookies()).get('org')?.value;
  const permission = await (await internalFetch('/auth/can-register', {
    headers: inviteCookie ? { cookie: `org=${encodeURIComponent(inviteCookie)}` } : {},
  })).json();
  if (permission.invitation) return <AcceptInvitation {...permission.invitation} />;
  if (process.env.DISABLE_REGISTRATION === 'true') {
    const canRegister = permission.register;
    if (!canRegister && !(await params?.searchParams)?.provider) {
      return (
        <>
          <LoginWithOidc />
          <div className="text-center">
            {inviteCookie ? 'This invitation has expired, was already used, or is invalid. Ask your workspace administrator for a new invitation.' : 'Anove Social is invitation-only. Ask your workspace administrator for an invitation.'}
            <br />
            <Link className="underline hover:font-bold" href="/auth/login">
              {t('login_instead', 'Login instead')}
            </Link>
          </div>
        </>
      );
    }
  }
  return <Register />;
}
