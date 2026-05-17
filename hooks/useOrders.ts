import { useQuery } from '@tanstack/react-query';
import { getOrders, getOrderById } from '@/api/orders';
import { useAuthStore } from '@/stores/authStore';

export const useOrders = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });
};

export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
};
