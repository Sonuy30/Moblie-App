import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { updateProfile } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

export const usePushNotifications = () => {
  const updatePushToken = useAuthStore(s => s.updatePushToken);

  const setup = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Push notifications permission not granted.');
        return;
      }

      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      let token = 'mock-expo-push-token-12345';

      if (!isExpoGo) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        console.log('Running in Expo Go: using a mock push token to prevent native push service crashes.');
      }

      updatePushToken(token);
      await updateProfile({ pushToken: token });  // PUT to backend → stored on customer document
    } catch (e) {
      console.log('Failed to setup push notifications or save token:', e);
    }
  };

  // Handle notification tap (navigate to correct screen)
  const setupHandlers = () => {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'order_update' && data.orderId) {
        router.push(`/order/${data.orderId}`);
      }
      if (data?.type === 'delivery_assigned' && data.orderId) {
        router.push(`/(staff)/delivery/${data.orderId}`);
      }
    });
  };

  return { setup, setupHandlers };
};

