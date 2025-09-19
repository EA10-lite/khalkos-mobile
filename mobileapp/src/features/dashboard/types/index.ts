/**
 * Dashboard feature type definitions
 */

export interface DashboardState {
  totalBalance: number;
  portfolioChange: number;
  recentTransactions: any[];
  quickActions: QuickAction[];
  isLoading: boolean;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
}
