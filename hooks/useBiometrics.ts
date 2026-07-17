import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    void (async () => {
      setIsSupported(await LocalAuthentication.hasHardwareAsync());
      setIsEnrolled(await LocalAuthentication.isEnrolledAsync());
    })();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isEnrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to AITS Shop",
      cancelLabel: "Use Password",
    });
    return result.success;
  }, [isSupported, isEnrolled]);

  return { isSupported, isEnrolled, authenticate };
}
