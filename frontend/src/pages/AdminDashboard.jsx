import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = storedUser.email;

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalSessions: 0, totalExchanges: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!userEmail) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userEmail}`);
        if (!res.ok) throw new Error('Failed to verify user profile');
        const profile = await res.json();
        
        if (profile.role === 'admin') {
          setIsAdmin(true);
          fetchData();
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error(err);
        setError('Authorization check failed.');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAdmin();
  }, [userEmail]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Stats
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'user-email': userEmail }
      });
      if (!statsRes.ok) throw new Error('Failed to fetch platform stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch Users
      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'user-email': userEmail }
      });
      if (!usersRes.ok) throw new Error('Failed to fetch user list');
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-email': userEmail
        }
      });
      if (!res.ok) throw new Error(`Failed to ${action} user`);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: currentStatus === 'suspended' ? 'active' : 'suspended' } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Verifying administrator privileges...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-xl font-bold text-gray-800 mt-4 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600 mb-6">
            You do not have the required administrator privileges to view this page.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Control Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Manage SkillX system, users, and platform statistics.</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 text-sm bg-red-100 text-red-800 px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.totalSessions}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Exchanges</p>
            <p className="text-3xl font-extrabold text-purple-600 mt-2">{stats.totalExchanges}</p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">User Directory</h2>
            <p className="text-gray-500 text-xs mt-0.5">Suspend, activate, or manage user access permissions.</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading directory...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                            <p className="text-gray-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          disabled={actionLoading === user._id || user.email === userEmail}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            user.status === 'suspended'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === user._id ? 'Updating...' : user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
