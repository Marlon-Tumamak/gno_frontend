'use client';

import { useState, useEffect, useCallback } from 'react';

interface Driver {
  id: number;
  name: string;
}

interface Route {
  id: number;
  name: string;
}

export default function DriverRouteManager() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [routeName, setRouteName] = useState('');
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const cancelModal = useCallback(() => {
    setDriverName('');
    setRouteName('');
    setEditingDriver(null);
    setEditingRoute(null);
    setShowDriverModal(false);
    setShowRouteModal(false);
    setError(null);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDriverModal || showRouteModal) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('bg-black/50')) {
          cancelModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDriverModal, showRouteModal, cancelModal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      
      const [driversRes, routesRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/drivers/`),
        fetch(`${apiUrl}/api/v1/routes/`)
      ]);

      if (driversRes.ok && routesRes.ok) {
        const driversData = await driversRes.json();
        const routesData = await routesRes.json();
        setDrivers(driversData);
        setRoutes(routesData);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Network error: Could not connect to server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!driverName.trim()) {
      setError('Driver name cannot be empty');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/drivers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: driverName.trim() }),
      });

      if (response.ok) {
        const newDriver = await response.json();
        setDrivers([...drivers, newDriver]);
        setDriverName('');
        setShowDriverModal(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add driver');
      }
    } catch (err) {
      setError('Network error');
      console.error('Add driver error:', err);
    }
  };

  const handleUpdateDriver = async () => {
    if (!driverName.trim() || !editingDriver) {
      setError('Driver name cannot be empty');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/drivers/${editingDriver.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: driverName.trim() }),
      });

      if (response.ok) {
        const updatedDriver = await response.json();
        setDrivers(drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d));
        setDriverName('');
        setEditingDriver(null);
        setShowDriverModal(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update driver');
      }
    } catch (err) {
      setError('Network error');
      console.error('Update driver error:', err);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/drivers/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDrivers(drivers.filter(d => d.id !== id));
        setError(null);
      } else {
        setError('Failed to delete driver');
      }
    } catch (err) {
      setError('Network error');
      console.error('Delete driver error:', err);
    }
  };

  const handleAddRoute = async () => {
    if (!routeName.trim()) {
      setError('Route name cannot be empty');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/routes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: routeName.trim() }),
      });

      if (response.ok) {
        const newRoute = await response.json();
        setRoutes([...routes, newRoute]);
        setRouteName('');
        setShowRouteModal(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add route');
      }
    } catch (err) {
      setError('Network error');
      console.error('Add route error:', err);
    }
  };

  const handleUpdateRoute = async () => {
    if (!routeName.trim() || !editingRoute) {
      setError('Route name cannot be empty');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/routes/${editingRoute.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: routeName.trim() }),
      });

      if (response.ok) {
        const updatedRoute = await response.json();
        setRoutes(routes.map(r => r.id === updatedRoute.id ? updatedRoute : r));
        setRouteName('');
        setEditingRoute(null);
        setShowRouteModal(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update route');
      }
    } catch (err) {
      setError('Network error');
      console.error('Update route error:', err);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/routes/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRoutes(routes.filter(r => r.id !== id));
        setError(null);
      } else {
        setError('Failed to delete route');
      }
    } catch (err) {
      setError('Network error');
      console.error('Delete route error:', err);
    }
  };

  const startEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverName(driver.name);
    setShowDriverModal(true);
  };

  const startEditRoute = (route: Route) => {
    setEditingRoute(route);
    setRouteName(route.name);
    setShowRouteModal(true);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Add Driver */}
        <div
          onClick={() => {
            setEditingDriver(null);
            setDriverName('');
            setShowDriverModal(true);
          }}
          className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-8 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">👤</span>
            </div>
            <h3 className="text-white text-2xl font-bold">Add Driver</h3>
            <p className="text-white/90 text-sm mt-2">{drivers.length} drivers</p>
          </div>
        </div>

        {/* Box 2: Add Route */}
        <div
          onClick={() => {
            setEditingRoute(null);
            setRouteName('');
            setShowRouteModal(true);
          }}
          className="cursor-pointer bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl p-8 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">🛣️</span>
            </div>
            <h3 className="text-white text-2xl font-bold">Add Route</h3>
            <p className="text-white/90 text-sm mt-2">{routes.length} routes</p>
          </div>
        </div>
      </div>

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingDriver ? 'Edit Driver' : 'Add Driver'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Enter driver name"
              className="w-full px-4 py-3 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={editingDriver ? handleUpdateDriver : handleAddDriver}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-semibold"
              >
                {editingDriver ? 'Update' : 'Add'}
              </button>
              <button
                onClick={cancelModal}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingRoute ? 'Edit Route' : 'Add Route'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Enter route name"
              className="w-full px-4 py-3 border-2 border-green-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={editingRoute ? handleUpdateRoute : handleAddRoute}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 font-semibold"
              >
                {editingRoute ? 'Update' : 'Add'}
              </button>
              <button
                onClick={cancelModal}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

