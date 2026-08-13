import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { globalSearch } from '../services/searchService';
import { 
  Layers, 
  Users, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  UserCheck, 
  Building2, 
  UserCheck as LeadIcon, 
  TrendingUp,
  CheckSquare,
  Calendar,
  ShieldCheck,
  Bell,
  Search,
  CheckCheck,
  X
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function Header({ isConnected }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useSocket();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Notification Bell Dropdown State
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Debounced Search Handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await globalSearch(searchQuery);
        if (res.success) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleResultClick = (path) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 backdrop-blur-md bg-slate-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  NexusCRM
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                    SaaS Complete
                  </span>
                </h1>
              </div>
            </Link>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-slate-400">
                <Link to="/dashboard" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dashboard</span>
                </Link>

                <Link to="/customers" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customers</span>
                </Link>

                <Link to="/leads" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <LeadIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Leads</span>
                </Link>

                <Link to="/deals" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pipeline</span>
                </Link>

                <Link to="/tasks" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tasks</span>
                </Link>

                <Link to="/meetings" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Meetings</span>
                </Link>

                <Link to="/settings/subscription" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <span className="text-xs">💳</span>
                  <span>Subscription</span>
                </Link>

                <Link to="/settings/usage" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <span className="text-xs">📊</span>
                  <span>Usage</span>
                </Link>

                <Link to="/workflows" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <span className="text-xs">⚡</span>
                  <span>Workflows</span>
                </Link>

                <Link to="/import" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <span className="text-xs">📥</span>
                  <span>Import</span>
                </Link>

                <Link to="/developer" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                  <span className="text-xs">💻</span>
                  <span>Developer</span>
                </Link>

                {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <>
                    <Link to="/settings/custom-fields" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                      <span className="text-xs">🎛️</span>
                      <span>Fields</span>
                    </Link>
                    <Link to="/settings/tags" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                      <span className="text-xs">🏷️</span>
                      <span>Tags</span>
                    </Link>
                    <Link to="/settings/webhooks" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                      <span className="text-xs">🔗</span>
                      <span>Webhooks</span>
                    </Link>
                    <Link to="/settings/api-keys" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                      <span className="text-xs">🔑</span>
                      <span>API Keys</span>
                    </Link>
                  </>
                )}

                {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <Link to="/audit-logs" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Audit Logs</span>
                  </Link>
                )}

                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/admin/companies" className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors bg-indigo-950/40 text-indigo-300 border border-indigo-500/30">
                    <span className="text-xs">🛡️</span>
                    <span>Admin</span>
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Global Search Input */}
          {isAuthenticated && (
            <div className="relative flex-1 max-w-xs hidden md:block" ref={searchRef}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers, leads, deals..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-900/80 text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Global Search Dropdown */}
              {showSearchDropdown && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 text-xs max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-slate-400 text-center">Searching...</div>
                  ) : (
                    <>
                      {/* Customers */}
                      {searchResults.customers?.length > 0 && (
                        <div className="border-b border-slate-800/60 p-2">
                          <div className="text-[10px] font-semibold uppercase text-blue-400 px-2 py-1">Customers</div>
                          {searchResults.customers.map(c => (
                            <div key={c.id} onClick={() => handleResultClick(`/customers/${c.id}`)} className="px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 flex justify-between">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-[10px] text-slate-400">{c.companyName || c.email}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Leads */}
                      {searchResults.leads?.length > 0 && (
                        <div className="border-b border-slate-800/60 p-2">
                          <div className="text-[10px] font-semibold uppercase text-emerald-400 px-2 py-1">Leads</div>
                          {searchResults.leads.map(l => (
                            <div key={l.id} onClick={() => handleResultClick('/leads')} className="px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 flex justify-between">
                              <span className="font-medium">{l.name}</span>
                              <span className="text-[10px] text-slate-400">{l.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Deals */}
                      {searchResults.deals?.length > 0 && (
                        <div className="border-b border-slate-800/60 p-2">
                          <div className="text-[10px] font-semibold uppercase text-amber-400 px-2 py-1">Deals</div>
                          {searchResults.deals.map(d => (
                            <div key={d.id} onClick={() => handleResultClick('/deals')} className="px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 flex justify-between">
                              <span className="font-medium">{d.title}</span>
                              <span className="text-[10px] text-amber-400">${d.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tasks */}
                      {searchResults.tasks?.length > 0 && (
                        <div className="border-b border-slate-800/60 p-2">
                          <div className="text-[10px] font-semibold uppercase text-purple-400 px-2 py-1">Tasks</div>
                          {searchResults.tasks.map(t => (
                            <div key={t.id} onClick={() => handleResultClick('/tasks')} className="px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 flex justify-between">
                              <span className="font-medium">{t.title}</span>
                              <span className="text-[10px] text-slate-400">{t.priority}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meetings */}
                      {searchResults.meetings?.length > 0 && (
                        <div className="p-2">
                          <div className="text-[10px] font-semibold uppercase text-cyan-400 px-2 py-1">Meetings</div>
                          {searchResults.meetings.map(m => (
                            <div key={m.id} onClick={() => handleResultClick('/meetings')} className="px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-200 flex justify-between">
                              <span className="font-medium">{m.title}</span>
                              <span className="text-[10px] text-slate-400">{new Date(m.date).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!searchResults.customers?.length && !searchResults.leads?.length && !searchResults.deals?.length && !searchResults.tasks?.length && !searchResults.meetings?.length && (
                        <div className="p-3 text-slate-400 text-center">No matching records found</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Header Actions (Notification Bell & Profile) */}
          <div className="flex items-center gap-3">
            <StatusBadge status={isConnected} label={isConnected ? "API Live" : "API Offline"} />

            {isAuthenticated ? (
              <>
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifDropdown(prev => !prev)}
                    className="relative p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full min-w-4 text-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover Dropdown */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 text-xs">
                      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <span className="font-semibold text-slate-200">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50">
                        {recentNotifications.length > 0 ? (
                          recentNotifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={`p-3 cursor-pointer hover:bg-slate-850 transition-colors ${!n.isRead ? 'bg-indigo-950/30' : ''}`}
                            >
                              <div className="font-semibold text-slate-200">{n.title}</div>
                              <div className="text-slate-400 mt-0.5">{n.message}</div>
                              <div className="text-[10px] text-slate-500 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500">No recent notifications</div>
                        )}
                      </div>

                      <div className="p-2 border-t border-slate-800 bg-slate-950 flex justify-between text-[11px]">
                        <Link to="/notifications" onClick={() => setShowNotifDropdown(false)} className="text-indigo-400 hover:underline">View All</Link>
                        <Link to="/settings/notifications" onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:underline">Preferences</Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile & Logout */}
                <div className="flex items-center gap-3 border-l border-slate-800 pl-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      {user.name}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium">{user.role}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                Sign In
              </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
