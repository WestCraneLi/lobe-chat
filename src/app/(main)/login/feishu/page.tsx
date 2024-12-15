'use client';

import React, { useEffect } from 'react';
import { createStyles } from 'antd-style';

// 开发环境
const devBaseUrl = 'http://localhost:3010';
// 生产环境
const prodBaseUrl = '';
const baseUrl = process.env.NODE_ENV === 'development' ? devBaseUrl : prodBaseUrl;
const appId = process.env.AUTH_FEISHU_ID;
const redirectUri = `${baseUrl}`;

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
    script.addEventListener('load', () => {
      if (window.QRLogin) {
        console.log('QRLogin loaded');

        // 确保 QRLogin 初始化在脚本加载完成后进行
        const gotoUrl = `https://passport.feishu.cn/suite/passport/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURI(
          redirectUri,
        )}&response_type=code&state=success_login`;

        // 初始化 QRLogin
        const QRLoginObj = window.QRLogin({
          goto: gotoUrl,
          id: 'qr-container',
          style:
            'width: 300px; height: 300px; margin-left: 3em; border: 0; background-color: #E6F4F3; background-size: cover;border-radius: 10px;',
        });

        const handleMessage = function (event: any) {
          const origin = event.origin;
          console.log('event', event);
          if (QRLoginObj.matchOrigin(origin) && window.location.href.includes('/login/feishu')) {
            const loginTmpCode = event.data;
            window.location.href = `${gotoUrl}&tmp_code=${loginTmpCode}`;
          }
        };
        if (typeof window.addEventListener !== 'undefined') {
          window.addEventListener('message', handleMessage, false);
        } else if (typeof window.attachEvent !== 'undefined') {
          window.attachEvent('onmessage', handleMessage);
        }
      } else {
        console.error('QRLogin is not defined even after script load');
      }
    });

    script.addEventListener('error', () => {
      console.error('Failed to load the QRLogin script.');
    })

    // 将脚本追加到文档
    document.body.append(script);

    // 清理脚本，避免重复加载
    return () => {
      script.remove();
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
