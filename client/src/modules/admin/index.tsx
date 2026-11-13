import React from 'react';
import { AdminView } from '../../components/Admin/AdminView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Language } from '../../i18n/translations';

interface AdminModuleProps {
  language: Language;
  socket: any;
  initialTab?: string;
}

export const AdminModule: React.FC<AdminModuleProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Enterprise Dispatch & Admin Module">
      <AdminView {...props} />
    </ErrorBoundary>
  );
};

export default AdminModule;
