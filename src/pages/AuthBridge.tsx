import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';

const RETURN_KEY = 'oauth_bridge_return';

/**
 * Login bridge.
 *
 * Managed OAuth only works on Lovable hosting (the /~oauth/* paths are served
 * by the hosting layer, not by this app). To let other deployments (Vercel,
 * custom hosts) use Google/Apple sign-in, they send the user here — on the
 * Lovable domain — where the OAuth round-trip happens. Once the session is
 * ready we hand the tokens back to the original origin in the URL hash
 * (hashes are never sent to servers or written to access logs) and that page
 * installs the session and cleans the URL immediately.
 */
export default function AuthBridge() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider');
    const rawReturn = params.get('return');

    const isAllowedReturn = (value: string) => {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' && url.hostname !== 'localhost') return false;
        return /(^|\.)(lovable\.(app|dev)|vercel\.app)$/.test(url.hostname) ||
          url.hostname === 'localhost';
      } catch {
        return false;
      }
    };

    if (rawReturn && isAllowedReturn(rawReturn)) {
      sessionStorage.setItem(RETURN_KEY, rawReturn);
    }

    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const target = sessionStorage.getItem(RETURN_KEY);

      if (session && target && isAllowedReturn(target)) {
        sessionStorage.removeItem(RETURN_KEY);
        const hash = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        window.location.replace(`${target}#${hash.toString()}`);
        return true;
      }
      if (session) {
        // No (valid) return target — the user is already signed in here.
        window.location.replace('/onboarding');
        return true;
      }
      return false;
    };

    (async () => {
      // Coming back from the provider: a session already exists.
      if (await finish()) return;

      if (provider !== 'google' && provider !== 'apple') {
        setError('مزوّد تسجيل الدخول غير معروف');
        return;
      }

      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth/bridge`,
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.redirected) return;
      await finish();
    })();
  }, []);

  return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      {error ? (
        <>
          <p className="text-base font-medium text-destructive">فشل تسجيل الدخول</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/auth" className="text-sm text-primary underline">
            العودة لصفحة الدخول
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جارٍ تسجيل الدخول...</p>
        </>
      )}
    </div>
  );
}
