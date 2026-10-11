'use client';

import { useEffect, useState } from 'react';

type Props = {
  make: string;
  model: string;
};

export default function SdrSection({ make, model }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!make || !model) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/sdrs?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [make, model]);

  if (loading) return null;
  if (!data || data.total === 0) return null;

  return (
    <div className="border border-slate-200 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-slate-900">
        Service Difficulty Reports
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Mechanic-filed reports of real failures and defects for {make} {model},
        covering {data.first_date} through {data.last_date}.{' '}
        <strong>{data.total}</strong> reports on file.
      </p>
      <p className="mt-1 text-xs text-slate-400 italic">
        SDRs are not regulatory mandates — they indicate failure patterns, not
        required actions.
      </p>

      {data.by_ata && data.by_ata.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-800 mb-3">By aircraft system</h3>
          <div className="space-y-2">
            {data.by_ata.map((row: any) => {
              const pct = Math.round((row.n / data.total) * 100);
              return (
                <div
                  key={row.ata_chapter}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-48 font-medium text-slate-700 truncate">
                    {row.ata_name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-slate-600 text-xs">
                    {row.n} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.recent && data.recent.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-slate-800 mb-3">
            Most recent reports
          </h3>
          <div className="space-y-4">
            {data.recent.map((r: any) => (
              <div
                key={r.control_number}
                className="border-l-4 border-amber-400 pl-4 py-1"
              >
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                    {r.ata_name}
                  </span>
                  <span className="text-slate-500">{r.difficulty_date}</span>
                  <span className="text-slate-600 font-medium">
                    {r.part_name}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  {r.remarks}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
