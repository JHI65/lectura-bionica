// Clases reutilizables. Objetivos táctiles de al menos 44 px y foco visible.
export const btnPrimary =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const btnSecondary =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-ink transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// Subrayado permanente: el enlace no debe depender solo del color (WCAG 1.4.1).
export const linkBtn =
  'text-brand underline underline-offset-4 hover:text-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded';

export const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';

export const sectionTitle = 'text-2xl font-semibold tracking-tight text-ink sm:text-3xl';
