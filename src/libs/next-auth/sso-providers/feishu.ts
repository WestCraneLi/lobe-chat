/* eslint-disable @typescript-eslint/no-explicit-any */
import { OAuthConfig, OAuthUserConfig } from "@auth/core/providers";

import { CommonProviderConfig } from "./sso.config";

const apiUserUrl = "https://open.feishu.cn/open-apis/authen/v1/user_info";
const apiAUthUrl = "https://open.feishu.cn/open-apis/authen/v1/authorize";

// 开发环境
const devBaseUrl = "http://localhost:3010";

// 生产环境
const prodBaseUrl = "";

const baseUrl =
  process.env.NODE_ENV === "development" ? devBaseUrl : prodBaseUrl;

interface FeishuProfile extends Record<string, any> {
  avatar: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  id: string;
  lastName: string;
  name: string;
  owner: string;
  permanentAvatar: string;
}
function LobeFeishuProvider(
  config: OAuthUserConfig<FeishuProfile>,
): OAuthConfig<FeishuProfile> {
  return {
    ...CommonProviderConfig,
    ...config,
    checks: ["none"],
    id: "feishu",
    name: "feishu",
    profile(profile) {
      return {
        email: profile.email,
        emailVerified: profile.emailVerified ? new Date() : null,
        id: profile.open_id.toString(),
        image: profile.avatar_thumb,
        name: profile.name ?? profile.login,
        providerAccountId: profile.id,
      };
    },
    type: "oauth",
  };
}

const provider = LobeFeishuProvider({
  authorization: {
    params: {
      app_id: process.env.AUTH_FEISHU_ID,
      redirect_uri: encodeURI(`${baseUrl}`),
      scope: "",
      state: "RANDOMSTATE",
    },
    url: apiAUthUrl,
  },
  token: {
    url: `${baseUrl}/api/feishu/token`,
  },
  userinfo: {
    async request({ tokens, provider }: any) {
      // 拿到上一步获取到的token，调用飞书获取用户信息的接口，获取用户信息
      const profile = await fetch(provider.userinfo?.url as URL, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "User-Agent": "authjs",
        },
      }).then(async (res) => await res.json());

      return profile.data;
    },
    url: apiUserUrl,
  },
});
export default provider;
