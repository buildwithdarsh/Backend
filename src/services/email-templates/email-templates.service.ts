import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../../modules/org-settings/org-settings.service.js';

export interface OrgBranding {
  orgName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail: string;
}

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  async getOrgBranding(orgId: string): Promise<OrgBranding> {
    const [org, name, logoUrl, primaryColor, secondaryColor, accentColor, supportEmail] =
      await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        }),
        this.orgSettings.get(orgId, 'branding', 'name'),
        this.orgSettings.get(orgId, 'branding', 'logo_url'),
        this.orgSettings.get(orgId, 'branding', 'primary_color'),
        this.orgSettings.get(orgId, 'branding', 'secondary_color'),
        this.orgSettings.get(orgId, 'branding', 'accent_color'),
        this.orgSettings.get(orgId, 'contact', 'email'),
      ]);

    return {
      orgName: name || org?.name || 'Our Team',
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#F5A623',
      secondaryColor: secondaryColor || '#4A7C59',
      accentColor: accentColor || '#FF6B35',
      supportEmail: supportEmail || '',
    };
  }

  // ─── OTP Email ──────────────────────────────────────────────────────────────

  otpEmail(branding: OrgBranding, otp: string, expiryMinutes = 5): { subject: string; html: string } {
    return {
      subject: `${otp} is your verification code`,
      html: this.wrapLayout(
        branding,
        `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
          Verification Code
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
          Use the code below to complete your verification. This code expires in ${expiryMinutes} minutes.
        </p>
        <div style="margin:0 auto 24px;padding:16px 0;background:#f8f9fa;border-radius:12px;text-align:center;">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:${branding.primaryColor};font-family:'Courier New',monospace;">
            ${otp}
          </span>
        </div>
        <p style="margin:0 0 4px;font-size:13px;color:#999;line-height:1.5;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        `,
      ),
    };
  }

  // ─── Magic Link Email ───────────────────────────────────────────────────────

  magicLinkEmail(branding: OrgBranding, link: string, expiryMinutes = 15): { subject: string; html: string } {
    return {
      subject: `Sign in to ${branding.orgName}`,
      html: this.wrapLayout(
        branding,
        `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
          Sign In
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
          Click the button below to sign in to your ${branding.orgName} account. This link expires in ${expiryMinutes} minutes.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${link}" target="_blank"
            style="display:inline-block;padding:14px 32px;background:${branding.primaryColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Sign In
          </a>
        </div>
        <p style="margin:0 0 4px;font-size:13px;color:#999;line-height:1.5;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 4px;font-size:12px;color:#999;word-break:break-all;">
          ${link}
        </p>
        `,
      ),
    };
  }

  // ─── Password Reset Email ──────────────────────────────────────────────────

  passwordResetEmail(branding: OrgBranding, link: string, expiryMinutes = 15): { subject: string; html: string } {
    return {
      subject: `Reset your ${branding.orgName} password`,
      html: this.wrapLayout(
        branding,
        `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
          Reset Your Password
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
          We received a request to reset the password for your ${branding.orgName} account. Click the button below to set a new password. This link expires in ${expiryMinutes} minutes.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${link}" target="_blank"
            style="display:inline-block;padding:14px 32px;background:${branding.primaryColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </div>
        <p style="margin:0 0 4px;font-size:13px;color:#999;line-height:1.5;">
          If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
        </p>
        <p style="margin:0 0 4px;font-size:12px;color:#999;word-break:break-all;">
          ${link}
        </p>
        `,
      ),
    };
  }

  // ─── Welcome Email ──────────────────────────────────────────────────────────

  welcomeEmail(branding: OrgBranding, userName: string): { subject: string; html: string } {
    return {
      subject: `Welcome to ${branding.orgName}!`,
      html: this.wrapLayout(
        branding,
        `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
          Welcome${userName ? `, ${userName}` : ''}!
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
          Thanks for joining ${branding.orgName}. We're excited to have you on board.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="#" target="_blank"
            style="display:inline-block;padding:14px 32px;background:${branding.primaryColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Get Started
          </a>
        </div>
        `,
      ),
    };
  }

  // ─── Invite Email ───────────────────────────────────────────────────────────

  inviteEmail(branding: OrgBranding, inviterName: string, link: string): { subject: string; html: string } {
    return {
      subject: `You've been invited to ${branding.orgName}`,
      html: this.wrapLayout(
        branding,
        `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
          You're Invited
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
          ${inviterName} has invited you to join <strong>${branding.orgName}</strong>. Click the button below to accept the invitation and create your account.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${link}" target="_blank"
            style="display:inline-block;padding:14px 32px;background:${branding.primaryColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Accept Invitation
          </a>
        </div>
        <p style="margin:0 0 4px;font-size:12px;color:#999;word-break:break-all;">
          ${link}
        </p>
        `,
      ),
    };
  }

  // ─── Layout Wrapper ─────────────────────────────────────────────────────────

  private wrapLayout(branding: OrgBranding, body: string): string {
    const logoBlock = branding.logoUrl
      ? `<img src="${branding.logoUrl}" alt="${branding.orgName}" style="max-height:40px;max-width:160px;" />`
      : `<span style="font-size:20px;font-weight:700;color:${branding.primaryColor};">${branding.orgName}</span>`;

    const supportLine = branding.supportEmail
      ? `Need help? Contact us at <a href="mailto:${branding.supportEmail}" style="color:${branding.primaryColor};text-decoration:none;">${branding.supportEmail}</a>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${branding.orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              ${logoBlock}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#999;">
                &copy; ${new Date().getFullYear()} ${branding.orgName}. All rights reserved.
              </p>
              ${supportLine ? `<p style="margin:0;font-size:12px;color:#999;">${supportLine}</p>` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
