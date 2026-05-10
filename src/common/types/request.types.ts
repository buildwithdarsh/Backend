import type { Request } from 'express';

export interface RequestUser {
  id: string;
  orgId: string;
  roleIds: string[];
  permissions: string[];
}

export interface RequestApiKey {
  id: string;
  orgId: string;
  scopes: string[];
}

export interface RequestEndUser {
  id: string;
  orgId: string;
}

export interface RequestWithOrg extends Request {
  orgId: string;
  userId?: string;
  user?: RequestUser;
  apiKey?: RequestApiKey;
  endUser?: RequestEndUser;
}

export interface JwtPayload {
  /** User id */
  sub: string;
  orgId: string;
  roleIds: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface SuperAdminJwtPayload {
  sub: string;
  role: string;
  type: 'super_admin';
}

export interface EndUserJwtPayload {
  /** EndUser id */
  sub: string;
  orgId: string;
  type: 'enduser_access' | 'enduser_refresh';
  iat?: number;
  exp?: number;
}
