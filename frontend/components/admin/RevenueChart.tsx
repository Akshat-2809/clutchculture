"use client";

import { useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";

type Point = { date: string; revenue: number; orders: number };

const W = 720;
const H = 260;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

const compactRupees = (paise: number) => {
  const r = paise / 100;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(r >= 1e6 ? 0 : 1)}L`;
  if (r >= 1e3) return `₹${(r / 1e3).toFixed(r >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(r)}`;
};
const shortDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** "Nice" round step for ~4 y-axis ticks. */
function niceMax(max: number) {
  if (max <= 0) return { top: 100_00, step: 25_00 };
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { top: step * Math.ceil(max / step), step };
}

/** Single-series revenue area chart with a snapping crosshair tooltip. */
export function RevenueChart({ data }: { data: Point[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { path, area, ticks, xs, y } = useMemo(() => {
    const { top, step } = niceMax(Math.max(...data.map((d) => d.revenue), 0));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xs = data.map(
      (_, i) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2),
    );
    const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
    const pts = data.map((d, i) => `${xs[i]},${y(d.revenue)}`);
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    return {
      xs,
      y,
      ticks,
      path: `M${pts.join("L")}`,
      area: `M${xs[0]},${y(0)}L${pts.join("L")}L${xs[xs.length - 1]},${y(0)}Z`,
    };
  }, [data]);

  if (!data.length) return null;

  const onMove = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++)
      if (Math.abs(xs[i]! - x) < Math.abs(xs[best]! - x)) best = i;
    setHover(best);
  };

  const labelEvery = Math.ceil(data.length / 6);
  const h = hover !== null ? data[hover]! : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-64 w-full touch-none overflow-visible"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Revenue per day"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {compactRupees(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={d.date}
              x={xs[i]}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted text-[11px]"
            >
              {shortDate(d.date)}
            </text>
          ) : null,
        )}
        <path d={area} className="fill-chart" fillOpacity={0.1} />
        <path
          d={path}
          fill="none"
          className="stroke-chart"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {h && hover !== null && (
          <g>
            <line
              x1={xs[hover]}
              x2={xs[hover]}
              y1={PAD.top}
              y2={y(0)}
              className="stroke-ink/30"
              strokeWidth={1}
            />
            <circle
              cx={xs[hover]}
              cy={y(h.revenue)}
              r={5}
              className="fill-chart stroke-background"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(xs[hover]! / W) * 100}%` }}
        >
          <p className="text-sm font-semibold text-ink">{formatPrice(h.revenue)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-muted">
            <span className="h-0.5 w-3 rounded bg-chart" />
            {shortDate(h.date)} · {h.orders} {h.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}

      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">View as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 text-right font-medium">Orders</th>
              <th className="py-1 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter((d) => d.orders > 0)
              .map((d) => (
                <tr key={d.date} className="border-t border-border">
                  <td className="py-1">{shortDate(d.date)}</td>
                  <td className="py-1 text-right">{d.orders}</td>
                  <td className="py-1 text-right text-ink">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
