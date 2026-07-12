import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    activeTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: 0,
    totalVehicles: 0
  });
  
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [statsRes, tripsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/trips?status=Dispatched')
      ]);
      setStats(statsRes.data);
      setActiveTrips(tripsRes.data.slice(0, 5)); // Show top 5 active trips
    } catch (err) {
      setError('Failed to sync telemetry data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds for simulated real-time data
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-label-caps text-label-caps uppercase animate-pulse">
        Establishing connection to fleet control telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg">
      {/* Title */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Control Center</h1>
        <p className="text-on-surface-variant font-body-sm">Real-time status overview of active assets and crew.</p>
      </div>

      {error && (
        <div className="bg-error-container border border-error text-on-error-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-sm">
        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Active Vehicles</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{stats.activeVehicles}</span>
            <span className="font-data-mono text-green-700 text-xs">ON-ROAD</span>
          </div>
        </div>
        
        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Available Assets</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{stats.availableVehicles}</span>
            <span className="font-data-mono text-blue-700 text-xs">READY</span>
          </div>
        </div>

        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">In Maintenance</span>
          <div className="flex items-baseline gap-2">
            <span className={`font-headline-lg text-headline-lg ${stats.maintenanceVehicles > 0 ? 'text-error' : 'text-primary'}`}>{stats.maintenanceVehicles}</span>
            {stats.maintenanceVehicles > 0 && (
              <span className="w-2 h-2 bg-error rounded-full animate-pulse ml-auto"></span>
            )}
          </div>
        </div>

        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Active Trips</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{stats.activeTrips}</span>
          </div>
        </div>

        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Drivers On Duty</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{stats.driversOnDuty}</span>
          </div>
        </div>

        <div className="bg-primary text-primary-fixed border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] opacity-70 mb-2">Fleet Utilization</span>
          <div className="flex items-baseline gap-2">
            <span className="font-data-mono text-headline-lg">{stats.fleetUtilization}%</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Telemetry map placeholder and active list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-stack-lg">
        {/* Left Side: Map Simulation & Details */}
        <div className="xl:col-span-2 space-y-stack-lg">
          {/* Telemetry Visual */}
          <div className="bg-[#FAF7F0] border border-outline-variant p-6 hard-shadow relative">
            <div className="flex justify-between items-center mb-4">
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold">Terminal Telemetry Status</span>
              <span className="font-data-mono text-xs text-green-700 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                LIVE RADAR ACTIVE
              </span>
            </div>
            
            {/* Visual Grid representing map */}
            <div className="h-64 border border-outline-variant chart-grid relative flex items-center justify-center overflow-hidden bg-surface-container-low">
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none text-[10px] font-data-mono text-outline/30 uppercase">
                <div className="flex justify-between">
                  <span>GRID-X: 04.992</span>
                  <span>SYS-TIME: 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>SCALE: 1:50000</span>
                  <span>ANT: BR-99</span>
                </div>
              </div>
              
              {/* Dynamic simulated radar markers */}
              {activeTrips.length === 0 ? (
                <div className="text-center font-label-caps text-xs text-on-surface-variant">
                  No dispatched vehicles currently transmitting GPS.
                </div>
              ) : (
                <div className="w-full h-full relative">
                  {activeTrips.map((trip, idx) => {
                    const positions = [
                      { top: '30%', left: '25%' },
                      { top: '65%', left: '45%' },
                      { top: '40%', left: '70%' },
                      { top: '20%', left: '55%' },
                      { top: '75%', left: '15%' }
                    ];
                    const pos = positions[idx % positions.length];
                    return (
                      <div
                        key={trip._id}
                        className="absolute flex items-center gap-2 group cursor-pointer"
                        style={{ top: pos.top, left: pos.left }}
                      >
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                        </span>
                        <div className="bg-primary text-on-primary font-data-mono text-[9px] px-1.5 py-0.5 border border-outline-variant/30 rounded-sm shadow-md pointer-events-none">
                          {trip.vehicleId?.regNumber}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Dispatches table */}
          <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
            <div className="bg-primary text-on-primary px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h2 className="font-label-caps text-label-caps uppercase font-bold">Active Deliveries</h2>
              <span className="font-data-mono text-xs">{activeTrips.length} Dispatched</span>
            </div>
            
            {activeTrips.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant font-body-sm">
                No active dispatches found. Use the Dispatch panel to create new trips.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container font-label-caps text-[10px] text-on-surface-variant uppercase border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-2">Vehicle</th>
                    <th className="px-6 py-2">Driver</th>
                    <th className="px-6 py-2">Route</th>
                    <th className="px-6 py-2">Payload</th>
                    <th className="px-6 py-2 text-right">Distance</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm divide-y divide-outline-variant/30">
                  {activeTrips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3 font-data-mono text-primary font-bold">{trip.vehicleId?.regNumber}</td>
                      <td className="px-6 py-3">{trip.driverId?.name}</td>
                      <td className="px-6 py-3 text-xs">
                        {trip.source} <span className="text-secondary font-bold">→</span> {trip.destination}
                      </td>
                      <td className="px-6 py-3 font-data-mono">{trip.cargoWeight} kg</td>
                      <td className="px-6 py-3 font-data-mono text-right">{trip.plannedDistance} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Operational Alerts panel */}
        <div className="space-y-stack-lg">
          <div className="bg-[#FAF7F0] border border-outline-variant p-6 hard-shadow">
            <h3 className="font-label-caps text-label-caps text-primary uppercase font-bold mb-4">Operations Manual</h3>
            <div className="space-y-3 font-body-sm text-on-surface-variant">
              <div className="p-3 bg-surface-container-low border border-outline-variant">
                <h4 className="font-bold text-xs text-primary font-label-caps uppercase mb-1">1. Driver Compliance</h4>
                <p className="text-xs">Drivers cannot be assigned to trips unless verified by a Safety Officer and having a valid license photo.</p>
              </div>
              <div className="p-3 bg-surface-container-low border border-outline-variant">
                <h4 className="font-bold text-xs text-primary font-label-caps uppercase mb-1">2. Vehicle Limits</h4>
                <p className="text-xs">Cargo weight must never exceed maximum load. Vehicles in maintenance auto-update to 'In Shop' and are excluded from trips.</p>
              </div>
              <div className="p-3 bg-surface-container-low border border-outline-variant">
                <h4 className="font-bold text-xs text-primary font-label-caps uppercase mb-1">3. Live Accounting</h4>
                <p className="text-xs">Fuel fills and expense receipts automatically update operational costs and ROI statistics in real-time.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF7F0] border border-outline-variant p-6 hard-shadow">
            <h3 className="font-label-caps text-label-caps text-primary uppercase font-bold mb-3">Live Log Feed</h3>
            <div className="font-data-mono text-[11px] leading-relaxed space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              <div className="text-green-700">[OK] Telemetry sync complete.</div>
              <div className="text-outline">[INFO] Logged 1 new vehicle registration.</div>
              {stats.maintenanceVehicles > 0 ? (
                <div className="text-error">[WARN] {stats.maintenanceVehicles} vehicles locked in shop.</div>
              ) : (
                <div className="text-outline">[INFO] Zero active vehicle alerts.</div>
              )}
              <div className="text-primary">[SYS] Authorization session check - Role confirmed.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
