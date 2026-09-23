import React from 'react';

/**
 * Standard Indian Food Safety Dietary Symbol
 * Green square with dot for Veg, Brown/Red square with triangle/circle for Non-Veg
 */
export const DietaryDot = ({ isVeg, size = 'md' }) => {
  const isV = Boolean(isVeg);
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const dotDim = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center justify-center border-2 rounded ${dim} ${
        isV ? 'border-emerald-600' : 'border-rose-600'
      } bg-white shrink-0`}
      title={isV ? 'Pure Vegetarian' : 'Non-Vegetarian'}
    >
      <span
        className={`rounded-full ${dotDim} ${
          isV ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
};

export const DietaryBadge = ({ isVeg, showLabel = true, size = 'md' }) => {
  const isV = Boolean(isVeg);
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold ${
        size === 'sm' ? 'text-[11px]' : 'text-xs'
      } ${
        isV
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
          : 'bg-rose-50 text-rose-800 border border-rose-200/80'
      }`}
    >
      <DietaryDot isVeg={isV} size={size} />
      {showLabel && <span>{isV ? 'VEG' : 'NON-VEG'}</span>}
    </div>
  );
};

export default DietaryBadge;
