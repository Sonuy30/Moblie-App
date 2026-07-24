import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, fetchOrderById, cancelOrder } from '@/api/orders';
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

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};


