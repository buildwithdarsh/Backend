import type { ScopedClient } from '../client';
import type { AuthResponse, EndUserProfile } from '../types';
import type {
  RegisterEndUserDto, LoginEndUserDto, EndUserSendOtpDto, EndUserVerifyOtpDto,
  StartSignupDto, VerifySignupOtpDto, EndUserRequestResetDto, EndUserResetPasswordDto,
  CompleteSignupDto, UpdateEndUserProfileDto, ChangeEndUserPasswordDto,
} from '../dto';

export function createStorefrontAuth(c: ScopedClient) {
  const orgSlug = c.root.orgSlug;

  return {
    // ─── Pre-Login (PUBLIC) ───────────────────────────────────────────

    register(data: RegisterEndUserDto) {
      return c.postDirect<AuthResponse>('/auth/register', { ...data, orgSlug }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    login(data: LoginEndUserDto) {
      return c.postDirect<AuthResponse>('/auth/login', { ...data, orgSlug }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    sendOtp(data: EndUserSendOtpDto) {
      return c.post<{ message: string }>('/auth/send-otp', { ...data, orgSlug });
    },

    verifyOtp(data: EndUserVerifyOtpDto) {
      return c.postDirect<AuthResponse>('/auth/verify-otp', { ...data, orgSlug }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    startSignup(data: StartSignupDto) {
      return c.post<{ userId: string; step: number; message: string }>('/auth/start-signup', { ...data, orgSlug });
    },

    verifySignupOtp(data: VerifySignupOtpDto) {
      return c.postDirect<AuthResponse>('/auth/verify-signup-otp', { ...data, orgSlug }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    requestPasswordReset(data: EndUserRequestResetDto) {
      return c.post<{ message: string }>('/auth/request-reset', { ...data, orgSlug });
    },

    forgotPassword(data: EndUserRequestResetDto) {
      return c.post<{ message: string }>('/auth/forgot-password', { ...data, orgSlug });
    },

    resetPassword(data: EndUserResetPasswordDto) {
      return c.post<{ message: string }>('/auth/reset-password', data);
    },

    getGoogleOAuthUrl() {
      return `${c.root.baseUrl}/api/v1/storefront/auth/google?orgSlug=${orgSlug}`;
    },

    getFacebookOAuthUrl() {
      return `${c.root.baseUrl}/api/v1/storefront/auth/facebook?orgSlug=${orgSlug}`;
    },

    demoLogin() {
      return c.postDirect<AuthResponse>('/auth/demo-login', { orgSlug }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    // ─── Post-Login (ENDUSER) ─────────────────────────────────────────

    completeSignup(data: CompleteSignupDto) {
      return c.postDirect<AuthResponse>('/auth/complete-signup', data, 'enduser').then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    me() {
      return c.get<EndUserProfile>('/auth/me', 'enduser');
    },

    updateProfile(data: UpdateEndUserProfileDto) {
      return c.patch<EndUserProfile>('/auth/profile', data, 'enduser');
    },

    changePassword(data: ChangeEndUserPasswordDto) {
      return c.post<{ message: string }>('/auth/change-password', data, 'enduser');
    },

    logout() {
      const refreshToken = c.root.getEndUserRefreshToken();
      return c.postDirect<void>('/auth/logout', { refreshToken }, 'enduser')
        .finally(() => c.root.clearEndUserTokens());
    },

    refresh() {
      const refreshToken = c.root.getEndUserRefreshToken();
      return c.postDirect<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => {
        c.root.saveEndUserTokens(r.accessToken, r.refreshToken);
        return r;
      });
    },

    // ─── Helpers ──────────────────────────────────────────────────────

    isAuthenticated: () => c.root.isEndUserAuthenticated(),
    getToken: () => c.root.getEndUserToken(),
    clearTokens: () => c.root.clearEndUserTokens(),
  };
}
