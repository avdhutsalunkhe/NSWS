export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'CLERK';
  fullName?: string;
  full_name?: string;
  email?: string;
  plantId?: number;
  plant_id?: number;
  plantCode?: string;
  plant_code?: string;
  plantName?: string;
  plant_name?: string;
  plantState?: string;
  state?: string;
  is_active?: number;
}

export interface Plant {
  id: number;
  plant_code: string;
  plant_name: string;
  undertaking_group: string;
  state: string;
  capacity_tcd: number;
  sws_id?: string;
  project_number?: string;
  approval_id?: string;
  pan_number?: string;
  pan_name?: string;
  pan_dob?: string;
  whitelisted_ip?: string;
  whitelisted_domain?: string;
  is_active: number;
}

export interface SugarSeason {
  id: number;
  season_name: string;
  start_date?: string;
  end_date?: string;
  status: 'ACTIVE' | 'CLOSED';
  is_current: number;
}

export interface ProductionRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  capacity_tcd: number;
  cane_crushed_month_mt: number;
  est_remaining_crushing_mt: number;
  est_seasonal_sugar_mt: number;
  white_from_cane_mt: number;
  white_from_reprocessing_old_mt: number;
  white_from_procured_raw_mt: number;
  white_from_transferred_white_mt: number;
  white_from_own_raw_stock_mt: number;
  white_sugar_produced_own_stock_mt: number;
  raw_from_cane_mt: number;
  raw_from_reprocessing_old_mt: number;
  raw_procured_domestic_mt: number;
  procured_raw_internal_transfer_mt: number;
  internal_transfer_plant_code?: string;
  internal_transfer_plant_name?: string;
  procured_from_imported_raw_mt: number;
  purity_mixed_juice_pct: number;
  pol_mixed_juice_pct: number;
}

export interface DiversionRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  juice_diverted_for_ethanol_mt: number;
  b_heavy_diverted_for_ethanol_mt: number;
  c_heavy_diverted_for_ethanol_mt: number;
  sale_b_heavy_mt: number;
  sale_juice_syrup_mt: number;
  sale_c_heavy_mt: number;
  ethanol_from_juice_kl: number;
  ethanol_from_b_heavy_kl: number;
  ethanol_from_c_heavy_kl: number;
}

export interface DispatchItem {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  category: string;
  release_order_no?: string;
  release_order_date?: string;
  qty_released_mt: number;
  qty_dispatched_mt: number;
  target_plant_code?: string;
  target_plant_name?: string;
  serial_number?: string;
  remarks?: string;
}

export interface HsnSales {
  hsn_17011490_mt: number;
  hsn_17019990_mt: number;
  hsn_others_mt: number;
}

export interface ImportExportRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  exp_66a_i_order_no?: string;
  exp_66a_i_order_date?: string;
  exp_66a_i_qty_released: number;
  exp_66a_i_qty_dispatched: number;
  exp_66a_ii_order_no?: string;
  exp_66a_ii_order_date?: string;
  exp_66a_ii_qty_released: number;
  exp_66a_ii_qty_dispatched: number;
  exp_66a_iii_order_no?: string;
  exp_66a_iii_order_date?: string;
  exp_66a_iii_qty_dispatched: number;
  exp_66a_iii_buyer_refinery?: string;
  exp_66b_order_no?: string;
  exp_66b_order_date?: string;
  exp_66b_qty_released: number;
  exp_66b_qty_received: number;
  import_applicable: string;
  imp_67a_i_white_mt: number;
  imp_67a_ii_raw_mt: number;
  imp_67b_aas_mt: number;
}

export interface InventoryRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  factory_white_opening: number;
  factory_white_closing: number;
  factory_biss_opening: number;
  factory_biss_closing: number;
  factory_raw_opening: number;
  factory_raw_closing: number;
  godown_white_opening: number;
  godown_white_closing: number;
  godown_biss_opening: number;
  godown_biss_closing: number;
  godown_raw_opening: number;
  godown_raw_closing: number;
}

export interface PackagingRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  jute_50kg_mt: number;
  jute_100kg_mt: number;
  pp_hdpe_50kg_mt: number;
  other_retail_loose_mt: number;
}

export interface HistoricalDueItem {
  season: string;
  caneCrushed: string;
  sugarProduction: string;
  sugarRecovery: string;
  payableCr: string;
  paidCr: string;
  farmersCount: string;
}

export interface CaneDuesRecord {
  id?: number;
  plant_id: number;
  season_name: string;
  month: string;
  current_payable_cr: number;
  current_paid_cr: number;
  current_farmers_count: number;
  historical?: HistoricalDueItem[];
}

export interface P2Report {
  id: number;
  approval_id: string;
  sws_id: string;
  project_number: string;
  plant_id: number;
  plant_code?: string;
  plant_name?: string;
  state?: string;
  undertaking_group?: string;
  capacity_tcd?: number;
  whitelisted_ip?: string;
  season_name: string;
  month: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'VALIDATION_FAILED' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CORRECTION_REQUIRED';
  validation_errors?: string;
  generated_payload?: string;
  submitted_at?: string;
  submitted_by?: string;
  approved_by?: string;
  rejection_reason?: string;
  response_log?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id?: number;
  active_environment: 'UAT' | 'PPE' | 'PRODUCTION';
  uat_url?: string;
  ppe_url?: string;
  prod_url?: string;
  access_id?: string;
  access_secret?: string;
  api_key?: string;
  jsession_id?: string;
  is_mock_mode?: number;
  auto_approve_clerk?: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  plant_code?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
