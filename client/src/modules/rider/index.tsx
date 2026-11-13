import React from 'react';
import { RiderView } from '../../components/Rider/RiderView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Language } from '../../i18n/translations';

interface RiderModuleProps {
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  language: Language;
  socket: any;
}

export const RiderModule: React.FC<RiderModuleProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Rider Passenger Module">
      <RiderView {...props} />
    </ErrorBoundary>
  );
};

export default RiderModule;
