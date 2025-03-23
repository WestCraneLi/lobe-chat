'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useUserStore } from '@/store/user';

const FeiShuLoginHydration = () => {
  const feishuLogin = useUserStore((s) => s.feishuLogin);
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state === 'success_login') {
      feishuLogin();
    }
  }, [searchParams, feishuLogin]);

  return null;
};

export default FeiShuLoginHydration;
