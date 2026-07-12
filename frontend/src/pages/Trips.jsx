import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Trips = () => {
  const { hasRole } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);

  // Form State - Plan
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
    status: 'Draft'
  });

  // Form State - Complete
  const [actualDistance, setActualDistance] = useState('');

  const fetchTripsAndResources = async () => {
    try {
      setError('');
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      setError('Failed to sync trip dispatch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndResources();
  }, []);

  const openPlanModal = () => {
    setFormData({
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeight: '',
      plannedDistance: '',
      status: 'Draft'
    });
    setError('');
    setIsPlanOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Find selected vehicle info for load limit warning
  const selectedVehicle = vehicles.find(v => v._id === formData.vehicleId);
  const selectedDriver = drivers.find(d => d._id === formData.driverId);

  const isOverloaded = selectedVehicle && formData.cargoWeight && Number(formData.cargoWeight) > selectedVehicle.maxLoadCapacity;
  const isDriverInvalid = selectedDriver && (
    selectedDriver.verificationStatus !== 'Verified' || 
    new Date(selectedDriver.licenseExpiryDate) < new Date()
  );

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Business rule checks
    if (isOverloaded) {
      setError('Cannot save trip: Cargo weight exceeds vehicle load capacity.');
      return;
    }

    try {
      await api.post('/trips', formData);
      setSuccess(`Trip planned successfully. Current state: ${formData.status}`);
      setIsPlanOpen(false);
      fetchTripsAndResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Error planning new trip.');
    }
  };

  const handleStatusTransition = async (id, status, distance = null) => {
    setError('');
    setSuccess('');
    try {
      const payload = { status };
      if (distance) payload.actualDistance = Number(distance);

      await api.put(`/trips/${id}/status`, payload);
      setSuccess(`Trip status successfully updated to: ${status}`);
      fetchTripsAndResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Status transition failed.');
    }
  };

  const triggerCompleteFlow = (trip) => {
    setSelectedTripId(trip._id);
    setActualDistance(trip.plannedDistance);
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    setIsCompleteOpen(false);
    handleStatusTransition(selectedTripId, 'Completed', actualDistance);
  };

  // Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="bg-surface-dim text-on-surface-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Draft</span>;
      case 'Dispatched':
        return <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase animate-pulse">Dispatched</span>;
      case 'Completed':
        return <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Completed</span>;
      case 'Cancelled':
      default:
        return <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Cancelled</span>;
    }
  };

  // Dropdown list filters
  // Only available vehicles can be assigned (unless editing draft with previously assigned)
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  // Only available and verified drivers can be assigned
  const availableDrivers = drivers.filter(d => d.status === 'Available' && d.verificationStatus === 'Verified');

  const filteredTrips = trips.filter(t => {
    return filterStatus === 'All' || t.status === filterStatus;
  });

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Trip Dispatch</h1>
          <p className="text-on-surface-variant font-body-sm">Manage dispatch lifecycles, assign vehicles/drivers, and enforce cargo business rules.</p>
        </div>
        
        {hasRole(['Fleet Manager']) && (
          <button
            onClick={openPlanModal}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">schedule_send</span>
            Plan New Trip
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-container border border-error text-on-error-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-tertiary-container border border-tertiary text-on-tertiary-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filter and stats row */}
      <section className="border border-outline-variant bg-[#FAF7F0] px-6 py-4 flex flex-wrap gap-stack-md items-center justify-between hard-shadow">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">Lifecycle Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface border border-outline-variant rounded-sm py-1 px-3 text-body-sm font-label-caps outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Operations</option>
            <option value="Draft">Drafts</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="font-data-mono text-xs text-on-surface-variant">
          Total Logged: <strong className="text-primary">{filteredTrips.length}</strong> / {trips.length}
        </div>
      </section>

      {/* Trips list */}
      <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Establishing logs connection...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm">No trip dispatches logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-caps text-label-caps uppercase border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 border-r border-on-primary/10">Route Details</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Vehicle ID</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Driver assigned</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Cargo Weight</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Planned Dist.</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Actual Dist.</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Status</th>
                  <th className="px-4 py-3 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                {filteredTrips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary">{trip.source}</div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-secondary">arrow_forward</span>
                        {trip.destination}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-data-mono">{trip.vehicleId?.regNumber || 'N/A'}</td>
                    <td className="px-4 py-3">{trip.driverId?.name || 'N/A'}</td>
                    <td className="px-4 py-3 font-data-mono">{trip.cargoWeight.toLocaleString()} kg</td>
                    <td className="px-4 py-3 font-data-mono">{trip.plannedDistance.toLocaleString()} km</td>
                    <td className="px-4 py-3 font-data-mono">
                      {trip.actualDistance ? `${trip.actualDistance.toLocaleString()} km` : '—'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(trip.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {trip.status === 'Draft' && hasRole(['Fleet Manager']) && (
                          <>
                            <button
                              onClick={() => handleStatusTransition(trip._id, 'Dispatched')}
                              className="bg-primary text-on-primary font-label-caps text-[9px] uppercase px-2.5 py-1 hover:bg-primary-container"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => handleStatusTransition(trip._id, 'Cancelled')}
                              className="bg-surface border border-outline-variant text-on-surface font-label-caps text-[9px] uppercase px-2.5 py-1 hover:bg-surface-container"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {trip.status === 'Dispatched' && hasRole(['Fleet Manager', 'Driver']) && (
                          <>
                            <button
                              onClick={() => triggerCompleteFlow(trip)}
                              className="bg-tertiary-container text-on-tertiary-container border border-tertiary font-label-caps text-[9px] uppercase px-2.5 py-1 hover:bg-tertiary"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusTransition(trip._id, 'Cancelled')}
                              className="bg-error-container text-on-error-container border border-error font-label-caps text-[9px] uppercase px-2.5 py-1 hover:bg-error"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {['Completed', 'Cancelled'].includes(trip.status) && (
                          <span className="font-label-caps text-[9px] text-on-surface-variant italic">LOCKED</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan New Trip Modal */}
      {isPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsPlanOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">Plan Logistics Dispatch</h2>

            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Departure Origin</label>
                  <input
                    type="text"
                    name="source"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Central Warehouse A"
                    value={formData.source}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Terminal Destination</label>
                  <input
                    type="text"
                    name="destination"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Terminal Delivery Hub B"
                    value={formData.destination}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    name="cargoWeight"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="500"
                    value={formData.cargoWeight}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Planned Distance (km)</label>
                  <input
                    type="number"
                    name="plannedDistance"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="120"
                    value={formData.plannedDistance}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Select Available Vehicle</label>
                  <select
                    name="vehicleId"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.vehicleId}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Choose Ready Asset --</option>
                    {availableVehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.regNumber} ({v.name} - Max: {v.maxLoadCapacity}kg)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Select Available Driver</label>
                  <select
                    name="driverId"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.driverId}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Choose Verified Driver --</option>
                    {availableDrivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.licenseCategory})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Business Rule Warnings */}
              {selectedVehicle && (
                <div className={`p-3 border rounded-sm text-xs font-body-sm ${isOverloaded ? 'bg-error-container border-error text-on-error-container' : 'bg-tertiary-container border-tertiary text-on-tertiary-container'}`}>
                  <strong>Cargo Load Verification:</strong>
                  {isOverloaded ? (
                    <div>ALERT: Payload of {formData.cargoWeight}kg exceeds vehicle capacity of {selectedVehicle.maxLoadCapacity}kg. Dispatch is blocked.</div>
                  ) : (
                    <div>Payload check ok: {formData.cargoWeight || 0}kg is within capacity of {selectedVehicle.maxLoadCapacity}kg.</div>
                  )}
                </div>
              )}

              {selectedDriver && isDriverInvalid && (
                <div className="p-3 bg-error-container border border-error text-on-error-container text-xs font-body-sm">
                  <strong>Driver Verification Error:</strong> The selected driver has an expired license or is not verified. Dispatch is blocked.
                </div>
              )}

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Immediate Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-label-caps text-xs">
                    <input
                      type="radio"
                      name="status"
                      value="Draft"
                      checked={formData.status === 'Draft'}
                      onChange={handleInputChange}
                    />
                    Save as Draft
                  </label>
                  <label className="flex items-center gap-2 font-label-caps text-xs">
                    <input
                      type="radio"
                      name="status"
                      value="Dispatched"
                      disabled={isOverloaded || isDriverInvalid}
                      checked={formData.status === 'Dispatched'}
                      onChange={handleInputChange}
                    />
                    Dispatch Immediately
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isOverloaded || isDriverInvalid}
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container disabled:opacity-40 transition-colors"
              >
                Approve Dispatch Planning
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Actual Distance Input Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-sm p-6 relative">
            <button
              onClick={() => setIsCompleteOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">Complete Delivery</h2>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Actual Travel Odometer (km)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-on-surface-variant font-body-sm">
                  Record the final trip odometer reading. This will increment the vehicle's mileage.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2 hover:bg-primary-container transition-colors"
              >
                File Completion Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
