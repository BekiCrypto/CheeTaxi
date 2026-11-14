import React from 'react';
import { AdminView } from '../../components/Admin/AdminView';
import { AdminAuthGate } from '../../components/Admin/AdminAuthGate';
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
      <AdminAuthGate>
        {(session) => (
          <AdminView
            {...props}
            adminSession={session}
          />
        )}
      </AdminAuthGate>
    </ErrorBoundary>
  );
};

export default AdminModule;
