import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = status ? status.toUpperCase() : 'DRAFT';

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = norm;

  if (norm === 'DRAFT') {
    badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
    label = 'Draft';
  } else if (norm === 'IN_PROGRESS') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'In Progress';
  } else if (norm === 'VALIDATION_FAILED') {
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    label = 'Validation Failed';
  } else if (norm === 'PENDING_APPROVAL') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
    label = 'Pending Approval';
  } else if (norm === 'APPROVED') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    label = 'Approved';
  } else if (norm === 'SUBMITTED') {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-300';
    label = 'Submitted to NSWS';
  } else if (norm === 'ACCEPTED') {
    badgeStyle = 'bg-green-100 text-green-800 border-green-400 font-bold';
    label = 'Accepted by NSWS';
  } else if (norm === 'REJECTED') {
    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
    label = 'Rejected by NSWS';
  } else if (norm === 'CORRECTION_REQUIRED') {
    badgeStyle = 'bg-orange-50 text-orange-700 border-orange-300';
    label = 'Correction Required';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};
