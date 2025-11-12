// Re-export database types
export type { Database } from './database.types';

// Common types
export type OrgId = string;
export type UserId = string;

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Domain types
export interface Person {
  id: string;
  orgId: string;
  companyId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  linkedinUrl?: string | null;
  tags: string[];
  ownerId?: string | null;
  lastContactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  orgId: string;
  name: string;
  website?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  tags: string[];
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  orgId: string;
  pipelineId: string;
  stageId: string;
  companyId?: string | null;
  personId?: string | null;
  name: string;
  valueCents?: number | null;
  currency: string;
  ownerId?: string | null;
  expectedCloseDate?: string | null;
  status: 'open' | 'won' | 'lost';
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface Task {
  id: string;
  orgId: string;
  title: string;
  dueAt?: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  ownerId?: string | null;
  companyId?: string | null;
  personId?: string | null;
  dealId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface Interaction {
  id: string;
  orgId: string;
  type: 'note' | 'email' | 'sms' | 'call' | 'meeting' | 'system';
  occurredAt: string;
  summary?: string | null;
  companyId?: string | null;
  personId?: string | null;
  dealId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

