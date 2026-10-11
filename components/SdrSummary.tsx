'use client';

import { useEffect, useState } from 'react';

type Props = {
  make: string;
  model: string;
};

type SdrData = {
  total: number;
  first_date: string | null;
  last_date: string | null;
  by_ata: { ata_chapter: string; ata_name: string; n: number }[];
};

export default function SdrSummary({ make, model }: Props) {
  const [data, setData] = useState<SdrData | null>(null);

  useEffect(() => {
    if (!make || !model) return;
    let cancelled = false;
    fetch(
      `/api/sdrs?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json && json.total > 0) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [make, model]);

  if (!data || data.total === 0) return null;

  const top = data.by_ata.slice(0, 3);

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔧</span>
        <div className="text-sm">
          <p className="font-medium text-slate-900">
            {data.total} Service Difficulty Reports on file for this model
          </p>
          <p className="mt-1 text-slate-700">
            Most reported systems:{' '}
            {top.map((t, i) => (
              <span key={t.ata_chapter}>
                {i > 0 && ' · '}
                <strong>{t.ata_name}</strong> ({t.n})
              </span>
            ))}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            SDRs are mechanic-filed reports of real failures and defects. Full
            details are included in the paid report.
          </p>
        </div>
      </div>
    </div>
  );
}
