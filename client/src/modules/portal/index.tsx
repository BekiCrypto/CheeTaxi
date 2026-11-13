import React from 'react';
import { PublicWebsite, PageId } from '../../components/Public/PublicWebsite';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Language } from '../../i18n/translations';

interface PublicPortalModuleProps {
  language: Language;
  onNavigateToApp: (role: 'rider' | 'driver' | 'admin' | 'split') => void;
  initialPageId?: string;
}

export const PublicPortalModule: React.FC<PublicPortalModuleProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Public Web Portal Module">
      <PublicWebsite
        language={props.language}
        onNavigateToApp={props.onNavigateToApp}
      />
    </ErrorBoundary>
  );
};

export default PublicPortalModule;
