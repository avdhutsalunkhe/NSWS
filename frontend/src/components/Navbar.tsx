import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Calendar, Lock, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

const MONTHS = [
  'October', 'November', 'December', 'January', 'February', 'March',
  'April', 'May', 'June', 'July', 'August', 'September'
];

export const Navbar: React.FC = () => {
  const {
    user,
    logout,
    selectedPlant,
    setSelectedPlant,
    allPlants,
    selectedSeason,
    setSelectedSeason,
    allSeasons,
    selectedMonth,
    setSelectedMonth
  } = useAuth();

  const isAdmin = user ? user.role === 'ADMIN' : false;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Organization */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpeg"
            alt="RBPSSK Logo"
            className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                RBPSSK
              </span>
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                NSWS v1.3
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Rajarambapu Patil Sahakari Sakhar Karkhana Ltd.
            </p>
          </div>
        </div>

        {/* Global Selectors: Plant, Season, Month */}
        <div className="hidden md:flex items-center space-x-3">
          
          {/* Plant Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 shadow-2xs">
            <Building2 className="w-4 h-4 text-red-600 mr-2 shrink-0" />
            {isAdmin ? (
              <select
                aria-label="Select Sugar Mill Plant"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                value={selectedPlant ? selectedPlant.id : ''}
                onChange={(e) => {
                  const p = allPlants.find(x => String(x.id) === e.target.value);
                  setSelectedPlant(p ? p : null);
                }}
              >
                {allPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    Plant {plant.plant_code} - {plant.plant_name} ({plant.state})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center text-xs font-bold text-slate-800">
                <span>
                  Plant {selectedPlant ? selectedPlant.plant_code : (user ? user.plantCode : '')} - {selectedPlant ? selectedPlant.plant_name : (user ? user.plantName : '')}
                </span>
                <span title="Locked to your assigned factory">
                  <Lock className="w-3.5 h-3.5 ml-2 text-slate-400" />
                </span>
              </div>
            )}
          </div>

          {/* Season Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-red-600 mr-2 shrink-0" />
            <span className="text-xs text-slate-500 mr-1 font-medium">Season:</span>
            <select
              aria-label="Select Sugar Season"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              {allSeasons.map((s) => (
                <option key={s.id} value={s.season_name}>
                  {s.season_name} {s.status === 'CLOSED' ? '(Closed)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 shadow-2xs">
            <span className="text-xs text-slate-500 mr-1 font-medium">Month:</span>
            <select
              aria-label="Select Reporting Month"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Pill & Logout */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-red-600 mr-2" />
            ) : (
              <UserCheck className="w-4 h-4 text-slate-600 mr-2" />
            )}
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user ? user.fullName : 'Guest'}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">
                {user ? user.role : ''} {user && user.role === 'CLERK' ? `(Plant ${user.username})` : ''}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out of ERP system"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
