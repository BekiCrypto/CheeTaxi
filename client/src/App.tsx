import React, { useState, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Language } from './i18n/translations';
import { useSocket } from './hooks/useSocket';
import { sounds } from './utils/audio';
import { useRoute, AppModuleId } from './modules/routing/router';

// Modular decoupled imports with code-splitting
const RiderModule = lazy(() => import('./modules/rider'));
const DriverModule = lazy(() => import('./modules/driver'));
const AdminModule = lazy(() => import('./modules/admin'));
const SimulatorModule = lazy(() => import('./modules/simulator'));
const PublicPortalModule = lazy(() => import('./modules/portal'));
const PublicTripTracker = lazy(() => import('./components/Tracking/PublicTripTracker').then(m => ({ default: m.PublicTripTracker })));
const PassengerMobileShell = lazy(() => import('./components/Rider/PassengerMobileShell').then(m => ({ default: m.PassengerMobileShell })));
const DriverMobileShell = lazy(() => import('./components/Driver/DriverMobileShell').then(m => ({ default: m.DriverMobileShell })));

function ModuleLoadingFallback({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[450px] text-slate-500 gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-extrabold tracking-wide uppercase text-slate-700">
          Loading {label}...
        </p>
        <p className="text-[11px] text-slate-400">
          Chebelew Mobility & Logistics Engine
        </p>
      </div>
    </div>
  );
}

export function App() {
  const { currentModule, subPath, setModule, isStandaloneMobile } = useRoute();
  const [language, setLanguage] = useState<Language>('en');

  // Active Demo Users
  const [currentRider] = useState({
    id: 'user_leila_01',
    name: 'Leila Haile',
    phone: '+251911223344',
  });

  const [currentDriverId] = useState('driver_ahmed_01');

  const { socket, isConnected } = useSocket();

  // Autonomous 1-Click Fast Demo Walkthrough
  const handleRunFastDemo = async () => {
    setModule('split');
    sounds.playBeep(440, 'triangle', 0.2);

    try {
      // Step 1: Create Ride Request
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: currentRider.id,
          riderName: currentRider.name,
          riderPhone: currentRider.phone,
          pickup: {
            address: 'Bole Medhanialem Mall, Addis Ababa',
            lat: 8.995,
            lng: 38.788,
          },
          destination: {
            address: 'Meskel Square, Addis Ababa',
            lat: 9.0105,
            lng: 38.7615,
          },
          vehicleCategory: 'sedan',
          paymentMethod: 'TELEBIRR',
        }),
      });

      const data = await res.json();
      if (!data.success || !data.ride) return;
      const rideId = data.ride.id;
      sounds.playIncomingRideAlert();

      // Step 2: Driver Ahmed accepts ride after 1.5s
      setTimeout(() => {
        if (socket) {
          socket.emit('ride:accept', { rideId, driverId: currentDriverId });
          sounds.playRideAccepted();
        }

        // Step 3: Driver marks arrived at pickup after 2.5s
        setTimeout(() => {
          if (socket) {
            socket.emit('ride:arrived', { rideId });
            sounds.playBeep(700, 'sine', 0.2);
          }

          // Step 4: Driver starts trip after 2s
          setTimeout(() => {
            if (socket) {
              socket.emit('ride:start', { rideId });
              sounds.playBeep(800, 'sine', 0.2);
            }

            // Step 5: Simulate car moving along route
            let step = 0;
            const coords = data.ride.routeCoordinates || [];
            const moveInterval = setInterval(() => {
              if (step >= coords.length || step > 8) {
                clearInterval(moveInterval);

                // Step 6: Complete trip
                if (socket) {
                  socket.emit('ride:complete', { rideId });
                  sounds.playPaymentSuccess();
                }

                // Step 7: Create & Pay via Telebirr
                setTimeout(async () => {
                  const tbRes = await fetch('/api/telebirr/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      rideId,
                      amountEtb: data.ride.fare.totalFare,
                      payerPhone: currentRider.phone,
                    }),
                  });
                  const tbData = await tbRes.json();
                  if (tbData.order) {
                    await fetch('/api/telebirr/pay', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId: tbData.order.orderId, success: true }),
                    });
                    sounds.playPaymentSuccess();
                  }
                }, 1500);

                return;
              }

              const [lat, lng] = coords[step];
              if (socket) {
                socket.emit('driver:location_update', {
                  driverId: currentDriverId,
                  lat,
                  lng,
                  heading: 45,
                });
              }
              step += 2;
            }, 800);
          }, 2000);
        }, 2500);
      }, 1500);
    } catch (err) {
      console.error('Demo error:', err);
    }
  };

  const getActiveUserName = () => {
    if (currentModule === 'driver') return 'Ahmed Mohammed (Driver)';
    if (currentModule === 'admin') {
      try {
        const cached = localStorage.getItem('chebelew_admin_user');
        if (cached) {
          const user = JSON.parse(cached);
          return `${user.name} (${(user.role || 'Admin').replace('_', ' ')})`;
        }
      } catch (e) {}
      return 'Almaz Tefera (Super Admin)';
    }
    return 'Leila Haile (Rider)';
  };

  return (
    <div className={`w-full flex flex-col bg-slate-100 font-sans antialiased text-slate-900 relative selection:bg-brand-500 selection:text-white ${
      currentModule === 'website' ? 'min-h-screen' : 'h-screen overflow-hidden'
    }`}>
      {/* Subtle ambient light mesh gradient seeping through frosted glass */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[110px]" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-brand-500/18 rounded-full blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[110px]" />
      </div>

      {currentModule !== 'website' && currentModule !== 'track' && !isStandaloneMobile && (
        <Navbar
          currentRole={currentModule}
          onRoleChange={(m) => setModule(m)}
          language={language}
          onLanguageChange={setLanguage}
          onRunFastDemo={handleRunFastDemo}
          activeUserName={getActiveUserName()}
        />
      )}

      <main className={`flex-1 relative z-10 ${
        currentModule === 'website'
          ? 'min-h-screen'
          : isStandaloneMobile
          ? 'h-screen w-full min-h-0 overflow-hidden'
          : 'h-[calc(100vh-68px)] w-full min-h-0 overflow-hidden'
      }`}>
        <Suspense fallback={<ModuleLoadingFallback label={currentModule.toUpperCase()} />}>
          {currentModule === 'track' && (
            <PublicTripTracker rideId={subPath || ''} />
          )}

          {currentModule === 'rider' && isStandaloneMobile && (
            <PassengerMobileShell
              currentRiderId={currentRider.id}
              currentRiderName={currentRider.name}
              currentRiderPhone={currentRider.phone}
              language={language}
              onLanguageChange={setLanguage}
              socket={socket}
            />
          )}

          {currentModule === 'rider' && !isStandaloneMobile && (
            <RiderModule
              currentRiderId={currentRider.id}
              currentRiderName={currentRider.name}
              currentRiderPhone={currentRider.phone}
              language={language}
              socket={socket}
            />
          )}

          {currentModule === 'driver' && isStandaloneMobile && (
            <DriverMobileShell
              currentDriverId={currentDriverId}
              language={language}
              onLanguageChange={setLanguage}
              socket={socket}
            />
          )}

          {currentModule === 'driver' && !isStandaloneMobile && (
            <DriverModule
              currentDriverId={currentDriverId}
              language={language}
              socket={socket}
            />
          )}

          {currentModule === 'admin' && (
            <AdminModule
              language={language}
              socket={socket}
              initialTab={subPath}
            />
          )}

          {currentModule === 'split' && (
            <SimulatorModule
              language={language}
              socket={socket}
              currentRiderId={currentRider.id}
              currentRiderName={currentRider.name}
              currentRiderPhone={currentRider.phone}
              currentDriverId={currentDriverId}
            />
          )}

          {currentModule === 'website' && (
            <PublicPortalModule
              language={language}
              onNavigateToApp={(r) => setModule(r)}
              initialPageId={subPath}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
