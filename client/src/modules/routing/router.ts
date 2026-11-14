import { useState, useEffect, useCallback } from 'react';

export type AppModuleId = 'rider' | 'driver' | 'admin' | 'split' | 'website' | 'track';

export interface RouteState {
  module: AppModuleId;
  subPath?: string;
  fullPath: string;
  isStandaloneMobile?: boolean;
}

function parsePath(pathname: string): RouteState {
  const clean = pathname.replace(/^\/+/, '').split('/');
  const first = clean[0]?.toLowerCase() || '';
  const second = clean[1] || '';

  // Standalone public ride tracking link (/track/:rideId)
  if (first === 'track') {
    return { module: 'track', subPath: second, fullPath: pathname, isStandaloneMobile: true };
  }

  // Driver Application (/driver or /driver-app or /app/driver)
  if (first === 'driver' || first === 'driver-app' || (first === 'app' && second.toLowerCase() === 'driver')) {
    const isStandalone = first === 'driver-app' || first === 'app' || window.location.search.includes('standalone=true');
    return { module: 'driver', subPath: second, fullPath: pathname, isStandaloneMobile: isStandalone };
  }

  // Admin Operational Console (/admin)
  if (first === 'admin') {
    return { module: 'admin', subPath: second, fullPath: pathname };
  }

  // Split View / Simulator (/split or /simulator)
  if (first === 'split' || first === 'simulator') {
    return { module: 'split', subPath: second, fullPath: pathname };
  }

  // Public Web Portal (/portal or /website)
  if (first === 'portal' || first === 'website') {
    return { module: 'website', subPath: second, fullPath: pathname };
  }

  // Passenger Application (/passenger or /rider or /app/passenger or root)
  if (first === 'passenger' || first === 'rider' || (first === 'app' && second.toLowerCase() === 'passenger')) {
    const isStandalone = first === 'passenger' || first === 'app' || window.location.search.includes('standalone=true');
    return { module: 'rider', subPath: second, fullPath: pathname, isStandaloneMobile: isStandalone };
  }

  // Default root path: If query param or path is empty, default to 'rider'
  return { module: 'rider', fullPath: '/', isStandaloneMobile: false };
}

type RouteListener = (route: RouteState) => void;
const listeners = new Set<RouteListener>();

export function navigateTo(path: string, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  const newState = parsePath(path);
  listeners.forEach((fn) => fn(newState));
}

export function useRoute() {
  const [route, setRoute] = useState<RouteState>(() =>
    parsePath(window.location.pathname)
  );

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parsePath(window.location.pathname));
    };

    const handleCustomNav = (r: RouteState) => {
      setRoute(r);
    };

    window.addEventListener('popstate', handlePopState);
    listeners.add(handleCustomNav);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      listeners.delete(handleCustomNav);
    };
  }, []);

  const navigate = useCallback((path: string, replace = false) => {
    navigateTo(path, replace);
  }, []);

  const setModule = useCallback((mod: AppModuleId, subPath?: string) => {
    let target = `/${mod}`;
    if (mod === 'split') target = '/simulator';
    else if (mod === 'website') target = subPath ? `/portal/${subPath}` : '/portal';
    else if (mod === 'track') target = subPath ? `/track/${subPath}` : '/track';
    else if (subPath) target = `/${mod}/${subPath}`;

    navigateTo(target);
  }, []);

  return {
    route,
    currentModule: route.module,
    subPath: route.subPath,
    isStandaloneMobile: route.isStandaloneMobile,
    navigate,
    setModule,
  };
}
