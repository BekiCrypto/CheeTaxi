import React from 'react';
import { RiderView } from '../Rider/RiderView';
import { DriverView } from '../Driver/DriverView';
import { Language } from '../../i18n/translations';
import { Ride } from '@shared/types';

interface SplitViewProps {
  language: Language;
  socket: any;
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  currentDriverId: string;
}

export const SplitView: React.FC<SplitViewProps> = ({
  language,
  socket,
  currentRiderId,
  currentRiderName,
  currentRiderPhone,
  currentDriverId,
}) => {
  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-68px)] w-full overflow-hidden divide-y xl:divide-y-0 xl:divide-x divide-slate-300">
      {/* Passenger Pane */}
      <div className="w-full xl:w-1/2 h-1/2 xl:h-full relative flex flex-col">
        <div className="bg-slate-900 text-white text-[11px] font-bold px-4 py-1.5 flex justify-between items-center z-10">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            PASSENGER APP: Leila Haile (+251911223344)
          </span>
          <span className="text-slate-400">Rider Client</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <RiderView
            currentRiderId={currentRiderId}
            currentRiderName={currentRiderName}
            currentRiderPhone={currentRiderPhone}
            language={language}
            socket={socket}
          />
        </div>
      </div>

      {/* Driver Pane */}
      <div className="w-full xl:w-1/2 h-1/2 xl:h-full relative flex flex-col">
        <div className="bg-slate-900 text-white text-[11px] font-bold px-4 py-1.5 flex justify-between items-center z-10 border-t xl:border-t-0 border-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            DRIVER APP: Ahmed Mohammed (ET-3-A78945 Toyota Corolla)
          </span>
          <span className="text-slate-400">Driver Console</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <DriverView
            currentDriverId={currentDriverId}
            language={language}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};
