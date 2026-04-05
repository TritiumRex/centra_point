import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">centra_point</h1>
        <nav className="space-y-4">
          <Link to="/" className="block hover:bg-gray-700 p-2 rounded">
            Dashboard
          </Link>
          <Link to="/things" className="block hover:bg-gray-700 p-2 rounded">
            Things
          </Link>
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top navigation */}
        <header className="bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Administration</h2>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
