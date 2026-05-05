import { useOrganizeStore } from '../stores/organize';
import type { OrganizeMode } from '../types';

const GB = 1024 * 1024 * 1024;

const SIZE_PRESETS = [
  { label: '1 GB', bytes: 1 * GB },
  { label: '2 GB', bytes: 2 * GB },
  { label: '4 GB', bytes: 4 * GB },
];

const MODE_LABELS: Record<OrganizeMode, string> = {
  none: 'None',
  date: 'By Date',
  name_pattern: 'By Filename',
  size_limit: 'By Size',
  combined: 'Date + Size',
};

function SizeLimitPicker({
  bytes,
  onChange,
}: {
  bytes: number;
  onChange: (b: number) => void;
}) {
  const isPreset = SIZE_PRESETS.some((p) => p.bytes === bytes);
  const customGb = bytes / GB;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {SIZE_PRESETS.map((p) => (
        <button
          key={p.bytes}
          onClick={() => onChange(p.bytes)}
          className={`rounded px-2 py-0.5 text-xs ${
            bytes === p.bytes
              ? 'bg-sage-700 text-cream'
              : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
          }`}
        >
          {p.label}
        </button>
      ))}
      <input
        type="number"
        min={0.1}
        step={0.1}
        value={isPreset ? '' : Number(customGb.toFixed(2))}
        placeholder="Custom GB"
        onChange={(e) => {
          const v = parseFloat(e.currentTarget.value);
          if (!isNaN(v) && v > 0) onChange(Math.round(v * GB));
        }}
        className="w-24 rounded border border-taupe-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sage-500"
      />
    </div>
  );
}

export function OrganizePanel() {
  const {
    config,
    setMode,
    setDateGranularity,
    setDateSource,
    setNamePatternRegex,
    setNamePatternFallback,
    setSizeLimitBytes,
    setCombinedDateGranularity,
    setCombinedDateSource,
    setCombinedSizeLimitBytes,
  } = useOrganizeStore();

  const { mode } = config;

  return (
    <div className="flex flex-col gap-3">
      {/* Mode picker */}
      <div className="flex flex-wrap gap-1">
        {(Object.keys(MODE_LABELS) as OrganizeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-2 py-0.5 text-xs ${
              mode === m
                ? 'bg-sage-700 text-cream'
                : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Date config */}
      {mode === 'date' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Group by</span>
            <div className="flex gap-1">
              {(['year', 'month', 'day'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setDateGranularity(g)}
                  className={`rounded px-2 py-0.5 text-xs capitalize ${
                    config.date?.granularity === g
                      ? 'bg-sage-700 text-cream'
                      : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Date from</span>
            <div className="flex gap-1">
              {(['exif', 'modified'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setDateSource(s)}
                  className={`rounded px-2 py-0.5 text-xs ${
                    config.date?.source === s
                      ? 'bg-sage-700 text-cream'
                      : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
                  }`}
                >
                  {s === 'exif' ? 'EXIF' : 'File date'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filename pattern config */}
      {mode === 'name_pattern' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Regex</span>
            <input
              type="text"
              value={config.namePattern?.regex ?? ''}
              onChange={(e) => setNamePatternRegex(e.currentTarget.value)}
              placeholder="^([^_]+)_.*"
              className="flex-1 rounded border border-taupe-300 px-2 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sage-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Fallback</span>
            <input
              type="text"
              value={config.namePattern?.fallback ?? ''}
              onChange={(e) => setNamePatternFallback(e.currentTarget.value)}
              placeholder="Other"
              className="flex-1 rounded border border-taupe-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sage-500"
            />
          </div>
          <p className="text-xs text-taupe-500">Capture group 1 becomes the folder name.</p>
        </div>
      )}

      {/* Size limit config */}
      {mode === 'size_limit' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Max size</span>
            <SizeLimitPicker
              bytes={config.sizeLimit?.bytes ?? 2 * GB}
              onChange={setSizeLimitBytes}
            />
          </div>
        </div>
      )}

      {/* Combined (date + size) config */}
      {mode === 'combined' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-taupe-500">
            Group by date, then split any folder that exceeds the size limit.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Group by</span>
            <div className="flex gap-1">
              {(['year', 'month', 'day'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setCombinedDateGranularity(g)}
                  className={`rounded px-2 py-0.5 text-xs capitalize ${
                    config.combined?.date.granularity === g
                      ? 'bg-sage-700 text-cream'
                      : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-taupe-600">Date from</span>
            <div className="flex gap-1">
              {(['exif', 'modified'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCombinedDateSource(s)}
                  className={`rounded px-2 py-0.5 text-xs ${
                    config.combined?.date.source === s
                      ? 'bg-sage-700 text-cream'
                      : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
                  }`}
                >
                  {s === 'exif' ? 'EXIF' : 'File date'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-14 shrink-0 text-xs text-taupe-600">Max size</span>
            <SizeLimitPicker
              bytes={config.combined?.sizeLimit.bytes ?? 2 * GB}
              onChange={setCombinedSizeLimitBytes}
            />
          </div>
        </div>
      )}
    </div>
  );
}
