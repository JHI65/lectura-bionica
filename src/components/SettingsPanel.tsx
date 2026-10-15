// Controles de personalización. Cada cambio se refleja al instante en la vista previa.
import {
  BOLD_RATIO_MAX,
  BOLD_RATIO_MIN,
  INTENSITY_LABEL,
  type FontFamily,
  type Intensity,
  type ReadingSettings,
  type ReadingTheme,
} from '../lib/bionic/settings';
import { btnSecondary } from './ui';

interface Props {
  settings: ReadingSettings;
  onChange: <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => void;
  onReset: () => void;
}

function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      <div role="radiogroup" className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`min-h-[44px] rounded-lg border px-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                active ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-slate-300 bg-white text-ink hover:border-slate-400'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="text-sm tabular-nums text-ink-soft">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-brand"
      />
    </div>
  );
}

export function SettingsPanel({ settings, onChange, onReset }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Negrita bionica</h2>
          <p className="text-sm text-ink-soft">Resalta el inicio de cada palabra</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.bionicEnabled}
          aria-label="Activar negrita bionica"
          onClick={() => onChange('bionicEnabled', !settings.bionicEnabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            settings.bionicEnabled ? 'bg-brand' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.bionicEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <Segmented<Intensity>
        legend="Intensidad"
        value={settings.intensity}
        options={(Object.keys(INTENSITY_LABEL) as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABEL[v] }))}
        onChange={(v) => onChange('intensity', v)}
      />

      <Slider
        id="bold-ratio"
        label="Letras en negrita"
        value={settings.boldRatio}
        min={BOLD_RATIO_MIN}
        max={BOLD_RATIO_MAX}
        step={0.05}
        format={(v) => `${Math.round(v * 100)} %`}
        onChange={(v) => onChange('boldRatio', Math.round(v * 100) / 100)}
      />
      <p className="-mt-3 text-xs leading-relaxed text-ink-soft">
        Porcentaje de cada palabra en negrita. Las palabras de 1 a 3 letras resaltan solo la primera.
      </p>

      <Segmented<FontFamily>
        legend="Tipo de letra"
        value={settings.fontFamily}
        options={[
          { value: 'sans', label: 'Sans' },
          { value: 'serif', label: 'Serif' },
          { value: 'mono', label: 'Mono' },
        ]}
        onChange={(v) => onChange('fontFamily', v)}
      />

      <Slider id="font-size" label="Tamaño de letra" value={settings.fontSize} min={14} max={28} step={1} format={(v) => `${v} px`} onChange={(v) => onChange('fontSize', v)} />
      <Slider id="line-height" label="Interlineado" value={settings.lineHeight} min={1.3} max={2.2} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => onChange('lineHeight', v)} />
      <Slider id="letter-spacing" label="Espaciado entre letras" value={settings.letterSpacing} min={0} max={0.12} step={0.01} format={(v) => `${v.toFixed(2)} em`} onChange={(v) => onChange('letterSpacing', v)} />

      <Segmented<ReadingSettings['readingWidth']>
        legend="Ancho de lectura"
        value={settings.readingWidth}
        options={[
          { value: 'estrecho', label: 'Estrecho' },
          { value: 'medio', label: 'Medio' },
          { value: 'ancho', label: 'Ancho' },
        ]}
        onChange={(v) => onChange('readingWidth', v)}
      />

      <Segmented<ReadingTheme>
        legend="Tema y contraste"
        value={settings.theme}
        options={[
          { value: 'claro', label: 'Claro' },
          { value: 'sepia', label: 'Sepia' },
          { value: 'oscuro', label: 'Oscuro' },
        ]}
        onChange={(v) => onChange('theme', v)}
      />

      <button type="button" className={`${btnSecondary} w-full`} onClick={onReset}>
        Restablecer ajustes
      </button>
    </div>
  );
}
