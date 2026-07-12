import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Maintenance = () => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isOpenTicketOpen, setIsOpenTicketOpen] = useState(false);
  const [isCloseTicketOpen, setIsCloseTicketOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // Form - Open
  const [formData, setFormData] = useState({
    vehicleId: '',
    description: '',
    cost: '',
    startDate: ''
  });

  // Form - Close
  const [closeData, setCloseData] = useState({
    cost: '',
    endDate: ''
  });

  const isFleetManager = hasRole(['Fleet Manager']);

  const fetchData = async () => {
    try {
      setError('');
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles')
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      setError('Failed to fetch maintenance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openTicketModal = () => {
    setFormData({
      vehicleId: '',
      description: '',
      cost: '0',
      startDate: new Date().toISOString().split('T')[0]
    });
    setError('');
    setIsOpenTicketOpen(true);
  };

  const handleOpenInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.vehicleId || !formData.description.trim()) {
      setError('Please provide all details to file ticket.');
      return;
    }

    try {
      await api.post('/maintenance', formData);
      setSuccess('Maintenance ticket filed. Vehicle status set to In Shop.');
      setIsOpenTicketOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating maintenance ticket.');
    }
  };

  const triggerCloseFlow = (log) => {
    setSelectedLogId(log._id);
    setCloseData({
      cost: log.cost.toString(),
      endDate: new Date().toISOString().split('T')[0]
    });
    setIsCloseTicketOpen(true);
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/maintenance/${selectedLogId}/close`, closeData);
      setSuccess('Maintenance ticket resolved. Vehicle status restored to Available.');
      setIsCloseTicketOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error resolving maintenance ticket.');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase animate-pulse">Servicing</span>;
    }
    return <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Closed</span>;
  };

  // Only Available (ready) vehicles can go into shop
  const readyVehicles = vehicles.filter(v => v.status === 'Available');

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Maintenance logs</h1>
          <p className="text-on-surface-variant font-body-sm">Track vehicle servicing, repair invoices, shop schedules, and logs.</p>
        </div>
        
        {isFleetManager && (
          <button
            onClick={openTicketModal}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">build</span>
            Open Service Ticket
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

      {/* Stats overview */}
      <section className="border border-outline-variant bg-[#FAF7F0] px-6 py-4 flex flex-wrap gap-stack-md items-center justify-between hard-shadow">
        <div className="font-data-mono text-xs text-on-surface-variant">
          Total Maintenance Tickets: <strong className="text-primary">{logs.length}</strong>
        </div>
        <div className="font-data-mono text-xs text-on-surface-variant">
          Active Tickets (In Shop): <strong className="text-error">{logs.filter(l => l.status === 'active').length}</strong>
        </div>
      </section>

      {/* Main Table */}
      <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Syncing service registers...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm">No maintenance records filed.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-caps text-label-caps uppercase border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 border-r border-on-primary/10">Vehicle ID</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Type</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Issue Description</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Repair Cost</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Date Opened</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Date Closed</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Status</th>
                  {isFleetManager && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3 font-data-mono text-primary font-bold">{log.vehicleId?.regNumber || 'N/A'}</td>
                    <td className="px-6 py-3 uppercase text-xs">{log.vehicleId?.type || 'N/A'}</td>
                    <td className="px-6 py-3">{log.description}</td>
                    <td className="px-6 py-3 font-data-mono">${log.cost.toLocaleString()}</td>
                    <td className="px-6 py-3 font-data-mono">{new Date(log.startDate).toISOString().split('T')[0]}</td>
                    <td className="px-6 py-3 font-data-mono">
                      {log.endDate ? new Date(log.endDate).toISOString().split('T')[0] : '—'}
                    </td>
                    <td className="px-6 py-3">{getStatusBadge(log.status)}</td>
                    {isFleetManager && (
                      <td className="px-6 py-3 text-right">
                        {log.status === 'active' ? (
                          <button
                            onClick={() => triggerCloseFlow(log)}
                            className="bg-primary text-on-primary font-label-caps text-[9px] uppercase px-2.5 py-1 hover:bg-primary-container"
                          >
                            Resolve Log
                          </button>
                        ) : (
                          <span className="font-label-caps text-[9px] text-on-surface-variant italic">CLOSED</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Service Ticket Modal */}
      {isOpenTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsOpenTicketOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">Open Maintenance Log</h2>

            <form onSubmit={handleOpenSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={formData.vehicleId}
                  onChange={handleOpenInputChange}
                >
                  <option value="">-- Choose Asset --</option>
                  {readyVehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.regNumber} - {v.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-on-surface-variant font-body-sm">
                  * Placing a vehicle in maintenance locks it from being assigned to dispatches.
                </p>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Issue Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Engine oil replacement, hydraulic seal inspection..."
                  value={formData.description}
                  onChange={handleOpenInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.cost}
                    onChange={handleOpenInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.startDate}
                    onChange={handleOpenInputChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors"
              >
                Approve Shop Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {isCloseTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-sm p-6 relative">
            <button
              onClick={() => setIsCloseTicketOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">Resolve Service Ticket</h2>

            <form onSubmit={handleCloseSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Final Invoice Amount ($)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={closeData.cost}
                  onChange={(e) => setCloseData(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Release Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={closeData.endDate}
                  onChange={(e) => setCloseData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors"
              >
                Close Ticket & Release Asset
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
