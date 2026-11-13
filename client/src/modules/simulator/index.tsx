import React from 'react';
import { SplitView } from '../../components/Split/SplitView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Language } from '../../i18n/translations';

interface SimulatorModuleProps {
  language: Language;
  socket: any;
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  currentDriverId: string;
}

export const SimulatorModule: React.FC<SimulatorModuleProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Dual Simulator Module">
      <SplitView {...props} />
    </ErrorBoundary>
  );
};

export default SimulatorModule;
