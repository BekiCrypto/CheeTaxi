import React from 'react';
import { DriverView } from '../../components/Driver/DriverView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Language } from '../../i18n/translations';

interface DriverModuleProps {
  currentDriverId: string;
  language: Language;
  socket: any;
}

export const DriverModule: React.FC<DriverModuleProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Driver In-Cab & Meter Module">
      <DriverView {...props} />
    </ErrorBoundary>
  );
};

export default DriverModule;
