export type Role = 'admin' | 'receptionist' | 'manager';

export interface User {
  username: string;
  role: Role;
  fullName: string;
  maNv?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  roles: Role[];
  subItems?: { id: string; label: string; }[];
}
