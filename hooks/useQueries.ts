import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  fetchPnLData,
  fetchBalances,
  fetchOverheadCategories,
  fetchPropertyCategories,
  fetchTransactions,
  fetchOptions,
  fetchDashboardData,
  type PnLData,
  type BalanceSummary,
  type OverheadCategory,
  type PropertyCategory,
  type Transaction,
  type OptionsData,
} from '@/lib/api';

// Query Keys - centralized for cache management
export const queryKeys = {
  pnl: ['pnl'] as const,
  balances: ['balances'] as const,
  overheadCategories: (period: 'month' | 'year') => ['overhead-categories', period] as const,
  propertyCategories: (period: 'month' | 'year') => ['property-categories', period] as const,
  transactions: ['transactions'] as const,
  options: ['options'] as const,
  dashboard: ['dashboard'] as const,
};

// P&L Hook
export function usePnL() {
  return useQuery({
    queryKey: queryKeys.pnl,
    queryFn: fetchPnLData,
    staleTime: 60_000, // 1 minute
  });
}

// Balances Hook
export function useBalances() {
  return useQuery({
    queryKey: queryKeys.balances,
    queryFn: fetchBalances,
    staleTime: 60_000, // 1 minute
  });
}

// Overhead Categories Hook
export function useOverheadCategories(period: 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: queryKeys.overheadCategories(period),
    queryFn: () => fetchOverheadCategories(period),
    staleTime: 60_000, // 1 minute
  });
}

// Property Categories Hook
export function usePropertyCategories(period: 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: queryKeys.propertyCategories(period),
    queryFn: () => fetchPropertyCategories(period),
    staleTime: 60_000, // 1 minute
  });
}

// Transactions Hook
export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: fetchTransactions,
    staleTime: 30_000, // 30 seconds (more dynamic data)
  });
}

// Options Hook (Settings)
export function useOptions() {
  return useQuery({
    queryKey: queryKeys.options,
    queryFn: fetchOptions,
    staleTime: 5 * 60_000, // 5 minutes (rarely changes)
  });
}

// Dashboard Hook - Parallel fetch all data
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardData,
    staleTime: 60_000, // 1 minute
  });
}

// Helper hook to check if any query is loading
export function useIsAnyLoading(queries: UseQueryResult[]) {
  return queries.some((query) => query.isLoading);
}

// Helper hook to check if all queries have data
export function useAllQueriesLoaded(queries: UseQueryResult[]) {
  return queries.every((query) => query.data !== undefined);
}
