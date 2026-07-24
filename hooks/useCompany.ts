import { useQuery } from '@tanstack/react-query';
import { fetchCompanySettings } from '@/api/company';

export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
