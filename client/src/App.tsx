import React, { useState, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Language } from './i18n/translations';
import { useSocket } from './hooks/useSocket';
import { sounds } from './utils/audio';

// Lazy-loaded functional modules for optimal code-splitting and performance
const RiderView = lazy(() =>
  import('./components/Rider/RiderView').then((m) => ({ default: m.RiderView }))
);
const DriverView = lazy(() =>
  import('./components/Driver/DriverView').then((m) => ({ default: m.DriverView }))
);
const AdminView = lazy(() =>
  import('./components/Admin/AdminView').then((m) => ({ default: m.AdminView }))
);
const SplitView = lazy(() =>
  import('./components/Split/SplitView').then((m) => ({ default: m.SplitView }))
);
const PublicWebsite = lazy(() =>
  import('./components/Public/PublicWebsite').then((m) => ({ default: m.PublicWebsite }))
);

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
  const [role, setRole] = useState<'rider' | 'driver' | 'admin' | 'split' | 'website'>('rider');
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
    setRole('split');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-900">
      <Navbar
        currentRole={role}
        onRoleChange={setRole}
        language={language}
        onLanguageChange={setLanguage}
        onRunFastDemo={handleRunFastDemo}
        activeUserName={
          role === 'driver'
            ? 'Ahmed Mohammed (Driver)'
            : role === 'admin'
            ? 'Almaz Tefera (Dispatcher)'
            : role === 'website'
            ? 'Public Visitor'
            : 'Leila Haile (Rider)'
        }
      />

      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<ModuleLoadingFallback label={role.toUpperCase()} />}>
          {role === 'rider' && (
            <RiderView
              currentRiderId={currentRider.id}
              currentRiderName={currentRider.name}
              currentRiderPhone={currentRider.phone}
              language={language}
              socket={socket}
            />
          )}

          {role === 'driver' && (
            <DriverView
              currentDriverId={currentDriverId}
              language={language}
              socket={socket}
            />
          )}

          {role === 'admin' && <AdminView language={language} socket={socket} />}

          {role === 'split' && (
            <SplitView
              language={language}
              socket={socket}
              currentRiderId={currentRider.id}
              currentRiderName={currentRider.name}
              currentRiderPhone={currentRider.phone}
              currentDriverId={currentDriverId}
            />
          )}

          {role === 'website' && (
            <PublicWebsite
              language={language}
              onNavigateToApp={(r) => setRole(r)}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
