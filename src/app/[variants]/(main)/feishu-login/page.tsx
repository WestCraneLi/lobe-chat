'use client';

import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';

import { useUserStore } from '@/store/user';

const redirectPath = '/chat';
const NEXT_PUBLIC_AUTH_FEISHU_ID = process.env.NEXT_PUBLIC_AUTH_FEISHU_ID;

const useStyles = createStyles(({ css }) => ({
  feishuLoginContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100vh;
  `,

  qrWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 300px;
    height: 300px;
    border: 0;
    border-radius: 10px;

    background-color: #fff;
    background-size: cover;
    box-shadow: 0 0 10px rgba(0, 0, 0, 10%);
  `,

  title: css`
    margin-block-end: 20px;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  `,
}));

const FeishuLoginPage = () => {
  const { styles } = useStyles();
  const feishuLogin = useUserStore((s) => s.feishuLogin);
  const scriptLoadedRef = useRef(false); // ✅ 防止多次加载 SDK
  const qrInstanceRef = useRef<any>(null); // ✅ 防止重复创建 QRLogin
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    const initFeishuLogin = async () => {
      if (scriptLoadedRef.current) {
        console.warn('Feishu SDK already loaded');
        return;
      }
      scriptLoadedRef.current = true; // ✅ 标记脚本已加载

      try {
        await feishuLogin();
        console.log('feishu Login executed');

        const redirectUri = `${window.location.origin}${redirectPath}`;
        const gotoUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${NEXT_PUBLIC_AUTH_FEISHU_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=success_login`;

        const script = document.createElement('script');
        script.src = '/sdk/feishu-qrLogin.js';
        script.async = true;

        const handleScriptLoad = () => {
          if (!window.QRLogin) {
            console.error('QRLogin is not defined.');
            return;
          }

          console.log('QRLogin loaded successfully.');

          // ✅ 先检查是否已有二维码，避免重复加载
          if (!qrGenerated) {
            qrInstanceRef.current = window.QRLogin({
              goto: gotoUrl,
              id: 'qr-container',
              style: 'width: 300px; height: 300px; border: 0; background-size: cover;',
            });
            setQrGenerated(true);
          }

          const handleMessage = (event: MessageEvent) => {
            if (
              qrInstanceRef.current.matchOrigin(event.origin) &&
              window.location.pathname.includes('/main/feishu-login')
            ) {
              window.location.href = `${gotoUrl}&tmp_code=${event.data}`;
            }
          };

          window.addEventListener('message', handleMessage);

          return () => {
            window.removeEventListener('message', handleMessage);
            qrInstanceRef.current?.cleanup?.();
          };
        };

        const handleScriptError = () => {
          console.error('Failed to load QRLogin script.');
        };

        script.addEventListener('load', handleScriptLoad);
        script.addEventListener('error', handleScriptError);

        document.body.append(script);

        return () => {
          script.removeEventListener('load', handleScriptLoad);
          script.removeEventListener('error', handleScriptError);
          script.remove();
        };
      } catch (error) {
        console.error('feishuLogin error:', error);
      }
    };

    initFeishuLogin();
  }, []);

  return (
    <div className={styles.feishuLoginContainer}>
      <div className={styles.title}>飞书扫码登录</div>
      <div className={styles.qrWrapper} id="qr-container" />
    </div>
  );
};

FeishuLoginPage.displayName = 'FeishuLogin';

export default FeishuLoginPage;
