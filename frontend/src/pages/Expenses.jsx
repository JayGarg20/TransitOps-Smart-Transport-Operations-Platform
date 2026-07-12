import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { hasRole } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Forms
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    liters: '',
    cost: '',
    date: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicleId: '',
    type: 'toll',
    amount: '',
    date: ''
  });

  const isFinancialOrManager = hasRole(['Fleet Manager', 'Financial Analyst', 'Driver']);

  const fetchData = async () => {
    try {
      setError('');
      const [vehiclesRes, fuelRes, expenseRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/expenses/fuel'),
        api.get('/expenses/other')
      ]);
      setVehicles(vehiclesRes.data);
      setFuelLogs(fuelRes.data);
      setOtherExpenses(expenseRes.data);
    } catch (err) {
      setError('Failed to fetch expense records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openFuelModal = () => {
    setFuelForm({
      vehicleId: '',
      liters: '',
      cost: '',
      date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setIsFuelModalOpen(true);
  };

  const openExpenseModal = () => {
    setExpenseForm({
      vehicleId: '',
      type: 'toll',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setIsExpenseModalOpen(true);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(fuelForm.liters) <= 0 || Number(fuelForm.cost) <= 0) {
      setError('Liters and cost must be positive numbers.');
      return;
    }

    try {
      await api.post('/expenses/fuel', fuelForm);
      setSuccess('Fuel purchase logged successfully.');
      setIsFuelModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging fuel.');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(expenseForm.amount) <= 0) {
      setError('Expense amount must be a positive number.');
      return;
    }

    try {
      await api.post('/expenses/other', expenseForm);
      setSuccess('Operational expense logged successfully.');
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging operational expense.');
    }
  };

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Fuel & Expense Log</h1>
          <p className="text-on-surface-variant font-body-sm">Log diesel fill-ups, road tolls, and operational fees to evaluate fleet profitability.</p>
        </div>

        {isFinancialOrManager && (
          <div className="flex gap-2">
            <button
              onClick={openFuelModal}
              className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">local_gas_station</span>
              Log Fuel Fill
            </button>
            <button
              onClick={openExpenseModal}
              className="bg-secondary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-orange-850 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Log Other Expense
            </button>
          </div>
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

      {/* Grid of history tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-stack-lg">
        {/* Fuel Logs Column */}
        <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
          <div className="bg-primary text-on-primary px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-label-caps text-label-caps uppercase font-bold">Fuel Ledger</h2>
            <span className="font-data-mono text-xs">{fuelLogs.length} logs</span>
          </div>

          {loading ? (
            <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Syncing logs...</div>
          ) : fuelLogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-sm">No fuel logs filed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container font-label-caps text-[10px] text-on-surface-variant uppercase border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-2">Vehicle ID</th>
                    <th className="px-6 py-2">Volume</th>
                    <th className="px-6 py-2">Invoice Cost</th>
                    <th className="px-6 py-2 text-right">Receipt Date</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                  {fuelLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-3 font-data-mono font-bold text-primary">{log.vehicleId?.regNumber || 'N/A'}</td>
                      <td className="px-6 py-3 font-data-mono">{log.liters.toLocaleString()} Liters</td>
                      <td className="px-6 py-3 font-data-mono">${log.cost.toLocaleString()}</td>
                      <td className="px-6 py-3 font-data-mono text-right">{new Date(log.date).toISOString().split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Other Expenses Column */}
        <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
          <div className="bg-primary text-on-primary px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-label-caps text-label-caps uppercase font-bold">Operations Expenses</h2>
            <span className="font-data-mono text-xs">{otherExpenses.length} logs</span>
          </div>

          {loading ? (
            <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Syncing logs...</div>
          ) : otherExpenses.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-sm">No other expenses filed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container font-label-caps text-[10px] text-on-surface-variant uppercase border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-2">Vehicle ID</th>
                    <th className="px-6 py-2">Type</th>
                    <th className="px-6 py-2">Amount</th>
                    <th className="px-6 py-2 text-right">Receipt Date</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                  {otherExpenses.map((exp) => (
                    <tr key={exp._id}>
                      <td className="px-6 py-3 font-data-mono font-bold text-primary">{exp.vehicleId?.regNumber || 'N/A'}</td>
                      <td className="px-6 py-3 capitalize text-xs">
                        <span className={`px-2 py-0.5 rounded-sm ${exp.type === 'toll' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'} font-label-caps text-[9px] uppercase`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-data-mono">${exp.amount.toLocaleString()}</td>
                      <td className="px-6 py-3 font-data-mono text-right">{new Date(exp.date).toISOString().split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Fuel Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-sm p-6 relative">
            <button
              onClick={() => setIsFuelModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4 font-label-caps">Log Fuel Fill</h2>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Select Fleet Vehicle</label>
                <select
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                >
                  <option value="">-- Choose Asset --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.regNumber} - {v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Volume (Liters)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="50"
                  value={fuelForm.liters}
                  onChange={(e) => setFuelForm(prev => ({ ...prev, liters: e.target.value }))}
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Invoice Cost ($)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="120"
                  value={fuelForm.cost}
                  onChange={(e) => setFuelForm(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Fill Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={fuelForm.date}
                  onChange={(e) => setFuelForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2 hover:bg-primary-container transition-colors"
              >
                Log Fuel Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-sm p-6 relative">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4 font-label-caps">Log Other Expense</h2>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Select Fleet Vehicle</label>
                <select
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                >
                  <option value="">-- Choose Asset --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.regNumber} - {v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Expense Type</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="toll">Road Toll</option>
                  <option value="other">Other Operational Expense</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="25"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Receipt Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2 hover:bg-primary-container transition-colors"
              >
                Log Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
