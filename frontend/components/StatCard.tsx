import React from 'react';

export default function StatCard({
  title,
  value,
  icon,
}: any) {
  return (
    <div className="
      bg-white
      rounded-2xl
      shadow-sm
      p-6
      border
      hover:shadow-lg
      transition
    ">
      <div className="flex justify-between">
        <div>
          <p className="text-slate-500">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div>
          {icon}
        </div>
      </div>
    </div>
  );
}