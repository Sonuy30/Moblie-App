import { useQuery } from '@tanstack/react-query';
import { fetchOrders, fetchOrderById } from '@/api/orders';
import { useAuthStore } from '@/stores/authStore';

export const useOrders = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetchOrders();
      return res.orders;
    },
    enabled: isAuthenticated,
  });
};

export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await fetchOrderById(id);
      return res.order;
    },
    enabled: !!id,
  });
};

