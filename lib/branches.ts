// Single source of truth for branch display details.
// Update this file (not the database) when real details for Branch 2 arrive.

export type BranchCode = 'musthafa_nagar' | 'branch_2';

export interface BranchInfo {
  code: BranchCode;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  /** "R G B" space-separated, matching the --brand-rgb CSS var the admin
   *  dashboard swaps in per branch (see app/admin/dashboard/page.tsx). */
  accentRgb: string;
}

export const BRANCHES: Record<BranchCode, BranchInfo> = {
  musthafa_nagar: {
    code: 'musthafa_nagar',
    name: 'Musthafa Nagar Branch',
    address: 'Musthafa Nagar, Khammam',
    phone: '9502453969',
    email: 'rapidconsultancy124@gmail.com',
    hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
    accentRgb: '204 0 0', // #CC0000 — matches the site-wide default brand red
  },
  branch_2: {
    code: 'branch_2',
    name: 'Kusumanchi Branch',
    address: 'Nelakondapalli Road, Near MRO Office, Khammam Dist, 507159',
    phone: '8179790969',
    email: 'rapidconsultancy124@gmail.com',
    hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
    accentRgb: '30 79 180', // #1E4FB4 — distinct navy blue for Branch 2
  },
};

export const BRANCH_LIST = Object.values(BRANCHES);

export const DEFAULT_BRANCH: BranchCode = 'musthafa_nagar';

export function getBranch(code?: string | null): BranchInfo {
  return BRANCHES[code as BranchCode] ?? BRANCHES[DEFAULT_BRANCH];
}
