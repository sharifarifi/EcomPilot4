import React from 'react';

const CompositeChart = ({ data, loading }) => {
  if (!data?.length) {
    return null;
  }

  const maxVal = Math.max(...data.map((d) => d.revenue)) * 1.2;

  return (
    <div className="relative h-72 w-full select-none">
      {loading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}

      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <line key={i} x1="0" y1={tick * 100 + '%'} x2="100%" y2={tick * 100 + '%'} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        <g className="transform scale-y-[-1] origin-bottom translate-y-[100%]">
          {data.map((d, i) => {
            const barHeight = (d.revenue / maxVal) * 100;
            const xPos = (i / data.length) * 100;
            const width = (100 / data.length) * 0.5;
            return (
              <rect
                key={i}
                x={`${xPos + width / 2}%`}
                y="0"
                width={`${width}%`}
                height={`${barHeight}%`}
                rx="4"
                className="fill-blue-500 hover:fill-blue-600 transition-all duration-500 cursor-pointer"
              >
                <title>Ciro: ₺{d.revenue}</title>
              </rect>
            );
          })}
        </g>

        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={data.map((d, i) => {
            const x = (i / data.length) * 100 + (100 / data.length) * 0.75;
            const y = 100 - (d.profit / (maxVal * 0.4)) * 100;
            return `${x},${y}`;
          }).join(' ')}
          className="drop-shadow-md"
        />

        {data.map((d, i) => {
          const x = (i / data.length) * 100 + (100 / data.length) * 0.75;
          const y = 100 - (d.profit / (maxVal * 0.4)) * 100;
          return (
            <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" className="fill-white stroke-orange-500 stroke-2 hover:r-5 transition-all cursor-pointer">
              <title>Kâr: ₺{d.profit}</title>
            </circle>
          );
        })}
      </svg>

      <div className="flex justify-between mt-3 px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-400 w-full text-center">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

export default CompositeChart;
