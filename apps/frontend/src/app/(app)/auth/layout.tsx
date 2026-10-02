import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Toaster } from '@gitroom/react/toaster/toaster';
export const dynamic = 'force-dynamic';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <MantineWrapper>
      <Toaster />
      <ReturnUrlComponent />
      <main className="anove-auth">
        <section className="anove-auth-panel" aria-label="Workspace access">
          <LogoTextComponent />
          <div className="anove-auth-form">{children}</div>
          <footer className="anove-auth-footer">
            <p>Anove International B.V.</p>
            <nav aria-label="Workspace information">
              <a href="/about">About</a>
              <a href="https://www.anove.ai/en/privacy-policy">Privacy</a>
              <a href="https://www.anove.ai/en/terms-of-use">Terms</a>
              <a href="mailto:admin@anove.ai">Help</a>
            </nav>
            <a className="anove-source" href="/anove/source.tar.gz">Powered by Postiz · Source code</a>
          </footer>
        </section>
        <section className="anove-auth-story" aria-label="Anove Social">
          <div className="anove-eyebrow">ANOVE / SOCIAL</div>
          <div className="anove-story-copy">
            <div className="anove-rule" />
            <h2>One voice.<br /><span>Every channel.</span></h2>
            <p>The workspace for Anove’s ideas, stories and conversations.</p>
            <div className="anove-story-steps"><span>01 / Plan</span><span>02 / Publish</span><span>03 / Measure</span></div>
          </div>
          <div className="anove-story-footer"><span>Built for the Anove team.</span><a href="https://anove.ai">anove.ai ↗</a></div>
          <img className="anove-watermark" src="/anove/mark.svg" alt="" aria-hidden="true" />
        </section>
      </main>
    </MantineWrapper>
  );
}
