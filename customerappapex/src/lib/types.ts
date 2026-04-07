import { ReactNode } from 'react';

// Core business entities
export interface Org {
  id: string;
  name: string;
  logo_url?: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  tz?: string;
}

export interface Bin {
  id: string;
  org_id: string;
  location_id: string;
  asset_tag: string;
  capacity_l?: number;
  oil_type?: string;
  active: boolean;
}

export interface Collection {
  id: string;
  org_id: string;
  location_id: string;
  bin_id: string;
  completed_at?: string;
  driver_id?: string;
  volume_l?: number;
  density?: number;
  net_mass_kg?: number;
  contamination_flag?: boolean;
  photos?: string[];
  signed_poc_url?: string;
  chain_of_custody_id?: string;
}

export interface Certificate {
  id: string;
  org_id: string;
  collection_id: string;
  certificate_no: string;
  pdf_url: string;
  hash_sha256: string;
  issued_at: string;
  verifier_url: string;
}

export interface EsgSummary {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  total_l: number;
  co2e_kg: number;
  pdf_url?: string;
}

export interface PickupRequest {
  id: string;
  org_id: string;
  location_id?: string;
  bin_id?: string;
  requested_by: string;
  reason?: string;
  est_volume_l?: number;
  photos?: string[];
  status: PickupRequestStatus;
  created_at?: string;
  updated_at?: string;
  scheduled_date?: string;
  completed_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AUDITOR = 'auditor',
  FINANCE = 'finance'
}

export enum PickupRequestStatus {
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  COLLECTED = 'collected',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum CollectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CERTIFIED = 'certified'
}

// Utility types
export interface DateRange {
  from: Date;
  to: Date;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}

// UI component types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => ReactNode;
}

export interface FilterState {
  search?: string;
  bin_id?: string;
  status?: string;
  date_range?: DateRange;
}

// Auth types
export interface AuthState {
  user: UserProfile | null;
  session: any; // Supabase session
  loading: boolean;
}

// Extended types with relations
export interface CollectionWithRelations extends Collection {
  location?: Location;
  bin?: Bin;
  certificate?: Certificate;
}

export interface LocationWithStats extends Location {
  bins_count: number;
  last_collection_date?: string;
  next_pickup_date?: string;
}

export interface BinWithLocation extends Bin {
  location?: Location;
}

// KPI types
export interface HomeKpis {
  monthly_collections_count: number;
  certificates_ready_count: number;
}