import { create } from "zustand";

export type Section =
  | "dashboard"
  | "child_care"
  | "elder_care"
  | "doctors"
  | "patients"
  | "bookings"
  | "prescriptions"
  | "caregivers"
  | "subusers"
  | "commission"
  | "analytics"
  | "verification"
  | "services"
  | "profile";

export interface UserPermissions {
  dashboard: boolean;
  child_care: boolean;
  elder_care: boolean;
  doctors: boolean;
  patients: boolean;
  bookings: boolean;
  prescriptions: boolean;
  caregivers: boolean;
  subusers: boolean;
  commission: boolean;
  analytics: boolean;
  verification: boolean;
  services: boolean;
  profile: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "sub_user";
  permissions: UserPermissions;
  activeBranches: string[];
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

  // Navigation
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Notifications
  notificationCount: number;
  setNotificationCount: (count: number) => void;
}

const defaultPermissions: UserPermissions = {
  dashboard: true,
  child_care: true,
  elder_care: true,
  doctors: true,
  patients: true,
  bookings: true,
  prescriptions: true,
  caregivers: true,
  subusers: true,
  commission: true,
  analytics: true,
  verification: true,
  services: true,
  profile: true,
};

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  user: null,
  login: (user) =>
    set({
      isAuthenticated: true,
      user: { ...user, permissions: { ...defaultPermissions, ...user.permissions } },
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      activeSection: "dashboard",
      notificationCount: 0,
    }),

  // Navigation
  activeSection: "dashboard",
  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Notifications
  notificationCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),
}));