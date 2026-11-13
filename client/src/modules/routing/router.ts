import { useState, useEffect, useCallback } from 'react';

export type AppModuleId = 'rider' | 'driver' | 'admin' | 'split' | 'website';

export interface RouteState {
  module: AppModuleId;
  subPath?: string;
  fullPath: string;
}

function parsePath(pathname: string): RouteState {
  const clean = pathname.replace(/^\/+/, '').split('/');
  const first = clean[0]?.toLowerCase() || '';
  const second = clean[1]?.toLowerCase() || '';

  if (first === 'driver') {
    return { module: 'driver', subPath: second, fullPath: pathname };
  }
  if (first === 'admin') {
    return { module: 'admin', subPath: second, fullPath: pathname };
  }
  if (first === 'split' || first === 'simulator') {
    return { module: 'split', subPath: second, fullPath: pathname };
  }
  if (first === 'portal' || first === 'website') {
    return { module: 'website', subPath: second, fullPath: pathname };
  }
  if (first === 'rider') {
    return { module: 'rider', subPath: second, fullPath: pathname };
  }

  // Default root path: If query param or path is empty, default to 'rider' with portal access
  return { module: 'rider', fullPath: '/' };
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
    if (mod === 'website') target = subPath ? `/portal/${subPath}` : '/portal';
    else if (subPath) target = `/${mod}/${subPath}`;

    navigateTo(target);
  }, []);

  return {
    route,
    currentModule: route.module,
    subPath: route.subPath,
    navigate,
    setModule,
  };
}
