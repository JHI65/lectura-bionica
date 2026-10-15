// Indicador de los pasos del flujo. Solo informa: no es navegable.
import { useI18n } from '../i18n/useI18n';

export function StepTracker({ current }: { current: number }) {
  const { t } = useI18n();
  return (
    <ol className="flex flex-wrap gap-2 text-sm" aria-label={t.steps.aria}>
      {t.steps.labels.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
              state === 'current'
                ? 'bg-brand text-white'
                : state === 'done'
                  ? 'bg-brand-soft text-brand'
                  : 'bg-slate-100 text-ink-soft'
            }`}
          >
            <span className="font-semibold tabular-nums">{index + 1}</span>
            <span>{label}</span>
            {state === 'done' && <span className="sr-only">{t.steps.done}</span>}
          </li>
        );
      })}
    </ol>
  );
}
