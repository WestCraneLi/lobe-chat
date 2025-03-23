import { StateCreator } from 'zustand/vanilla';

import { enableAuth, enableClerk, enableFeiShu, enableNextAuth } from '@/const/auth';
import { LobeUser } from '@/types/user';

import { UserStore } from '../../store';

export interface UserAuthAction {
  enableAuth: () => boolean;
  /**
   * universal login method
   */
  feishuLogin: (params?: any) => Promise<void>;
  /**
   * universal logout method
   */
  logout: () => Promise<void>;
  /**
   * universal login method
   */
  openLogin: () => Promise<void>;
  resetUser: () => void;
  setUser: (userInfo: LobeUser) => void;
}

export const createAuthSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  UserAuthAction
> = (set, get) => ({
  enableAuth: () => {
    return enableAuth;
  },
  feishuLogin: async (params: any = {}) => {
    if (!enableFeiShu) return;
    if (get().isSignedIn) return;

    const redirectPath = '/chat';
    const body = {
      loginTime: Date.now(),
      redirect_uri: `${window.location.origin}${redirectPath}`,
      url: window.location.href,
      ...params,
    };

    try {
      const response = await fetch('/api/feishu/userinfo', {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'System error');
      }

      const data = await response.json();
      console.log('Feishu login data:', data);
      get().setUser({
        ...data.data.qrUserInfo,
        ...data.data.tokenInfo,
      });
    } catch (error) {
      console.error('Feishu login error:', error);
      // 拦截器、toast等
    }
  },
  logout: async () => {
    if (enableClerk) {
      get().clerkSignOut?.({ redirectUrl: location.toString() });

      return;
    }

    if (enableNextAuth) {
      const { signOut } = await import('next-auth/react');
      signOut();
      return;
    }

    if (enableFeiShu) {
      get().resetUser();
      return;
    }
  },
  openLogin: async () => {
    if (enableClerk) {
      const reditectUrl = location.toString();
      get().clerkSignIn?.({
        fallbackRedirectUrl: reditectUrl,
        signUpForceRedirectUrl: reditectUrl,
        signUpUrl: '/signup',
      });

      return;
    }

    if (enableNextAuth) {
      const { signIn } = await import('next-auth/react');
      // Check if only one provider is available
      const providers = get()?.oAuthSSOProviders;
      if (providers && providers.length === 1) {
        signIn(providers[0]);
        return;
      }
      signIn();
      return;
    }

    if (enableFeiShu) {
      const { redirect } = await import('next/navigation');
      redirect('/main/feishu-login');
      return;
    }
    return;
  },
  resetUser: () => {
    set({
      isSignedIn: false,
      user: { id: '' },
    });
  },
  setUser: (userInfo: LobeUser) => {
    set({
      isSignedIn: true,
      user: userInfo,
    });
  },
});
