import { useEffect, useState } from 'react';
import { checkServerStatus } from '../utils/serverStatus';

/**
 * Proactively wakes up the server when the app loads
 * This triggers Render to start the server before the user even tries to authenticate
 */
export function useServerWakeUp() {
  const [showStartingScreen, setShowStartingScreen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let checkInterval: NodeJS.Timeout;

    const wakeUpServer = async () => {

      // Initial check
      const initialStatus = await checkServerStatus();

      if (!isMounted) return;

      if (initialStatus.isAvailable) {
        setIsReady(true);
        setShowStartingScreen(false);
        return;
      }

      // Server not ready - show starting screen immediately
      setShowStartingScreen(true);

      // Keep checking every 1 second until server is ready
      checkInterval = setInterval(async () => {
        const status = await checkServerStatus();

        if (!isMounted) {
          clearInterval(checkInterval);
          return;
        }

        if (status.isAvailable) {
          setIsReady(true);
          setShowStartingScreen(false);
          clearInterval(checkInterval);
        }
      }, 1000); // Check every 1 second
    };

    // Start wake-up process immediately
    wakeUpServer();

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  return { showStartingScreen, isReady };
}
