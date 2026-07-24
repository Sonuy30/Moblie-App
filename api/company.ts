import client from './client';

export interface CompanySettings {
  returnWindowDays: number;
  nonReturnableCategories: string[];
}

export const fetchCompanySettings = async (): Promise<CompanySettings> => {
  const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
  const { data } = await client.get<CompanySettings>('/api/mobile/company/settings', {
    params: { companySlug: COMPANY_SLUG },
  });
  return data;
};
