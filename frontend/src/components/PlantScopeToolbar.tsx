import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Layers, Lock } from 'lucide-react';

interface PlantScopeToolbarProps {
  onToggleViewMode?: () => void;
  viewMode?: 'SINGLE' | 'ALL_PLANTS';
  hasAllPlantsView?: boolean;
}

export const PlantScopeToolbar: React.FC<PlantScopeToolbarProps> = ({
  onToggleViewMode,
  viewMode,
  hasAllPlantsView
}) => {
  const { user, selectedPlant, setSelectedPlant, allPlants } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  // Fallback to first available plant if selectedPlant is null or invalid
  const validAdminPlant = selectedPlant && allPlants.some(p => p.id === selectedPlant.id)
    ? selectedPlant
    : (allPlants.length > 0 ? allPlants[0] : null);

  let activePlant = null;
  if (user && user.role === 'CLERK') {
    if (user.plantId) {
      activePlant = allPlants.find(p => String(p.id) === String(user.plantId));
    }
    if (!activePlant && user.plantCode) {
      activePlant = allPlants.find(p => String(p.plant_code) === String(user.plantCode));
    }
    if (!activePlant && user.username) {
      activePlant = allPlants.find(p => String(p.plant_code) === String(user.username));
    }
  } else {
    activePlant = validAdminPlant;
  }

  // Auto-synchronize selectedPlant in AuthContext when plants change
  useEffect(() => {
    if (isAdmin && allPlants.length > 0) {
      const exists = selectedPlant && allPlants.some(p => p.id === selectedPlant.id);
      if (!exists) {
        setSelectedPlant(allPlants[0]);
      }
    }
  }, [allPlants, selectedPlant, isAdmin]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Sugar Mill / Factory Scope
            </span>
            <div className="text-sm font-black text-slate-900 flex items-center flex-wrap gap-2">
              <span>{activePlant ? activePlant.plant_name : 'Loading Factories...'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                CODE: {activePlant ? activePlant.plant_code : '-'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePlant ? activePlant.state : '-'} | Capacity: {activePlant && activePlant.capacity_tcd ? activePlant.capacity_tcd.toLocaleString() : 0} TCD)
              </span>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-600">Switch Factory:</span>
              <select
                aria-label="Select Sugar Mill Plant"
                value={validAdminPlant ? validAdminPlant.id : ''}
                onChange={(e) => {
                  const found = allPlants.find(p => String(p.id) === e.target.value);
                  if (found) {
                    setSelectedPlant(found);
                  }
                }}
                className="text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:border-red-600 focus:outline-hidden cursor-pointer"
              >
                {allPlants.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plant {p.plant_code} - {p.plant_name} ({p.capacity_tcd} TCD)
                  </option>
                ))}
              </select>
            </div>

            {hasAllPlantsView && onToggleViewMode ? (
              <button
                type="button"
                onClick={onToggleViewMode}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === 'ALL_PLANTS'
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>{viewMode === 'ALL_PLANTS' ? 'Return to Factory Form' : 'All Plants Comparison Table'}</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Locked to Plant {user ? user.username : ''} ({user ? user.fullName : ''})
          </div>
        )}
      </div>

      {/* Quick Plant Switcher Pills for Admin */}
      {isAdmin && allPlants.length > 0 ? (
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Quick Mill Switch:</span>
          {allPlants.map((p) => {
            const isSelected = validAdminPlant && validAdminPlant.id === p.id && viewMode !== 'ALL_PLANTS';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlant(p);
                  if (onToggleViewMode && viewMode === 'ALL_PLANTS') {
                    onToggleViewMode();
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700'
                }`}
              >
                Plant {p.plant_code} ({p.plant_name.replace(' Sugar Mills Ltd', '').replace(' Sugar Mills', '')})
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
