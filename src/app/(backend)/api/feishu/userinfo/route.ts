import { NextRequest, NextResponse } from 'next/server';

const APP_ID = process.env.NEXT_PUBLIC_AUTH_FEISHU_ID;
const APP_SECRET = process.env.NEXT_PUBLIC_AUTH_FEISHU_SECRET;
const LARK_PASSPORT_HOST = 'https://passport.feishu.cn/suite/passport/oauth/';
const LARK_BASE_URL = 'https://open.feishu.cn/open-apis';

class QrLogin {
  private larkPassportHost: string;
  private larkBaseUrl: string;
  private appId: string;
  private appSecret: string;
  private tokenInfo: Record<string, any> = {};
  private userInfo: Record<string, any> = {};

  constructor(appId: string, appSecret: string, larkPassportHost: string, larkBaseUrl: string) {
    this.larkPassportHost = larkPassportHost;
    this.larkBaseUrl = larkBaseUrl;
    this.appId = appId;
    this.appSecret = appSecret;
  }

  private async appAccessToken(): Promise<string> {
    const payload = JSON.stringify({ app_id: this.appId, app_secret: this.appSecret });
    const response = await fetch(`${this.larkBaseUrl}/auth/v3/app_access_token/internal`, {
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await response.json();
    return data.tenant_access_token;
  }

  async getTokenInfo(jsonParam: any): Promise<Record<string, any>> {
    const urlParams = new URL(jsonParam.url).searchParams;
    const code = urlParams.get('code');
    if (!code) return {};

    const token = await this.appAccessToken();
    const response = await fetch(`${this.larkBaseUrl}/authen/v1/oidc/access_token`, {
      body: JSON.stringify({ code, grant_type: 'authorization_code' }),
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await response.json();
    if (data.code !== 0) return {};

    this.tokenInfo = {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      tokenType: data.data.token_type,
    };
    return this.tokenInfo;
  }

  async getUserInfo(): Promise<Record<string, any>> {
    if (!this.tokenInfo.accessToken) return {};

    try {
      const response = await fetch(`${this.larkBaseUrl}/authen/v1/user_info`, {
        headers: {
          'Authorization': `${this.tokenInfo.tokenType} ${this.tokenInfo.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.code !== 0) return {};

      this.userInfo = {
        avatar: data.data.avatar_url,
        avatarUrl: data.data.avatar_url,
        email: '',
        firstName: '',
        fullName: data.data.name,
        id: data.data.open_id,
        lastName: '',
        name: data.data.name,
        openId: data.data.open_id,
        tenantKey: data.data.tenant_key,
        userId: data.data.open_id,
        username: data.data.name,
      };
      return this.userInfo;
    } catch (error) {
      console.error(error);
      return {};
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const qrLogin = new QrLogin(APP_ID!, APP_SECRET!, LARK_PASSPORT_HOST, LARK_BASE_URL);

    const tokenInfo = await qrLogin.getTokenInfo(body);
    const qrUserInfo = await qrLogin.getUserInfo();

    if (!tokenInfo && qrUserInfo) {
      return NextResponse.json({
        data: {},
        message: 'Scan QR code to obtain user information.',
        status: 600,
      });
    }

    return NextResponse.json({
      data: {
        qrUserInfo,
        tokenInfo,
      },
      message: 'Get user info success',
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({
      data: {},
      message: (error as Error).message || 'Server error',
      status: 500,
    });
  }
}
