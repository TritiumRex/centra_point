import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Things from './Things';
import Instances from './Instances';
import MenuAdmin from './MenuAdmin';

export default function Admin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Top bar */}
      <header className="h-11 bg-gray-950 border-b border-gray-800 flex items-center px-4 shrink-0">
        <h1 className="text-sm font-bold tracking-wide text-white mr-6">centra_point</h1>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            Dashboard
          </button>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            Things
          </NavLink>
          <NavLink
            to="/admin/menu"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            Menu
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:inline">frank@tibernium.com</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<Things />} />
          <Route path="things/:id/instances" element={<Instances />} />
          <Route path="menu" element={<MenuAdmin />} />
        </Routes>
      </div>
    </div>
  );
}
