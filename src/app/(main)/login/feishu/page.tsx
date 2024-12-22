'use client';

import React, { useEffect } from 'react';
import { createStyles } from 'antd-style';

// 开发环境
const devBaseUrl = 'http://localhost:3010';
// 生产环境
const prodBaseUrl = '';
const baseUrl = process.env.NODE_ENV === 'development' ? devBaseUrl : prodBaseUrl;
const redirectUri = `${baseUrl}`;
const NEXT_PUBLIC_AUTH_FEISHU_ID = process.env.NEXT_PUBLIC_AUTH_FEISHU_ID

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

    background-size: cover;
    border: 0;
  `,

  title: css`
    margin-block-end: 20px;
    font-size: 20px;
    font-weight: 600;
    color: '#333';
  `
}));

const QRLoginPage = () => {
  const { styles } = useStyles();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/sdk/feishu.sdk.js';
    script.async = true; // Make script load asynchronously

    const handleScriptLoad = () => {
      if (!window.QRLogin) {
        console.error('QRLogin is not defined even after script load');
        return;
      }

      console.log('QRLogin loaded');

      // Generate the authorization URL
      const gotoUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${NEXT_PUBLIC_AUTH_FEISHU_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=success_login`;

      // Initialize QRLogin widget
      const QRLoginObj = window.QRLogin({
        goto: gotoUrl,
        id: 'qr-container',
        style: 'width: 300px; height: 300px; margin-left: 3em; border: 0; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); background-size: cover; border-radius: 10px;',
      });

      const handleMessage = (event: any) => {
        const origin = event.origin;
        if (QRLoginObj.matchOrigin(origin) && window.location.href.includes('/login/feishu')) {
          const loginTmpCode = event.data;
          window.location.href = `${gotoUrl}&tmp_code=${loginTmpCode}`;
        }
      };

      // Add event listener for 'message' event
      window.addEventListener('message', handleMessage);

      // Cleanup event listener and QRLogin object on unmount
      return () => {
        window.removeEventListener('message', handleMessage);
        QRLoginObj && QRLoginObj.cleanup && QRLoginObj.cleanup();
      };
    };

    const handleScriptError = () => {
      console.error('Failed to load the QRLogin script.');
    };

    // Add event listeners for script loading and error
    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);

    // Append the script to the body
    document.body.appendChild(script);

    // Cleanup on component unmount: remove the script
    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
      document.body.removeChild(script);
    };
  });

  return (
    <div className={styles.feishuLoginContainer}>
      <div className={styles.title}>飞书扫码登录</div>
      <div className={styles.qrWrapper} id="qr-container" />
    </div>
  );
};

export default QRLoginPage;
