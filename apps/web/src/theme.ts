// ─── BuildHub Unified Theme ────────────────────────────────────────────────
// Import from this file instead of writing raw Tailwind strings inline.
// All class strings here are hand-typed — zero regex contamination.

export const t = {
  // ── PAGE SHELLS ──────────────────────────────────────────────────────────
  page:        'min-h-screen bg-background text-foreground',
  pageInner:   'max-w-7xl mx-auto px-6 pb-20',

  // ── CARDS ────────────────────────────────────────────────────────────────
  card:        'bg-card border border-border rounded-3xl',
  cardLg:      'bg-card border border-border rounded-[2.5rem]',
  cardXl:      'bg-card border border-border rounded-[3rem]',
  cardDark:    'bg-background rounded-[3rem] shadow-2xl',
  cardHover:   'hover:shadow-card hover:border-primary/20 transition-all',

  // ── TYPOGRAPHY ───────────────────────────────────────────────────────────
  h1:          'text-4xl font-black text-foreground tracking-tight',
  h2:          'text-3xl font-black text-foreground tracking-tight',
  h3:          'text-xl font-black text-foreground',
  h4:          'text-base font-black text-foreground',
  label:       'text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]',
  muted:       'text-sm text-muted-foreground font-medium',
  micro:       'text-[9px] font-black uppercase tracking-widest',

  // ── BUTTONS ──────────────────────────────────────────────────────────────
  btnPrimary:  'bg-primary text-brand-navy font-black rounded-2xl px-8 py-3 text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim hover:scale-[1.02] transition-all',
  btnSecondary:'bg-card border border-border text-foreground/70 font-black rounded-2xl px-6 py-3 text-xs uppercase tracking-widest hover:bg-muted transition-all',
  btnGhost:    'text-muted-foreground font-black text-xs uppercase tracking-widest hover:text-foreground transition-colors',
  btnDanger:   'bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black rounded-2xl px-6 py-3 text-xs hover:bg-rose-500/20 transition-all',

  // ── INPUTS ───────────────────────────────────────────────────────────────
  input:       'w-full p-4 bg-muted border border-border rounded-2xl text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 transition-all',
  select:      'w-full p-4 bg-muted border border-border rounded-2xl text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 transition-all',
  textarea:    'w-full p-4 bg-muted border border-border rounded-2xl text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 resize-none transition-all',

  // ── BADGES ───────────────────────────────────────────────────────────────
  badgeYellow: 'px-3 py-1 bg-primary-pale text-primary text-[9px] font-black uppercase tracking-widest rounded-full',
  badgeGreen:  'px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20',
  badgeRed:    'px-3 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-500/20',
  badgeAmber:  'px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20',
  badgeNavy:   'px-3 py-1 bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest rounded-full border border-border',

  // ── ICONS ────────────────────────────────────────────────────────────────
  iconBoxYellow: 'w-12 h-12 bg-primary-pale text-primary rounded-2xl flex items-center justify-center',
  iconBoxNavy:   'w-12 h-12 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center border border-border',
  iconBoxGreen:  'w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center',

  // ── DIVIDERS ─────────────────────────────────────────────────────────────
  divider:     'border-t border-border',
  row:         'border-b border-border',

  // ── TABLES ───────────────────────────────────────────────────────────────
  tableHead:   'bg-muted text-[10px] font-black uppercase text-muted-foreground tracking-[0.15em]',
  tableRow:    'border-b border-border hover:bg-muted/40 transition-colors group',
  tableCell:   'px-6 py-5 text-sm font-bold text-foreground/80',

  // ── STAT CARD ────────────────────────────────────────────────────────────
  statCard:    'bg-card border border-border p-6 rounded-3xl shadow-sm',

  // ── EMPTY STATE ──────────────────────────────────────────────────────────
  emptyState:  'bg-card border-2 border-dashed border-border rounded-[3rem] p-20 text-center',

  // ── MODAL OVERLAY ────────────────────────────────────────────────────────
  overlay:     'fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4',
  modal:       'bg-card border border-border rounded-[3rem] w-full max-w-md shadow-2xl p-10',

  // ── HEADER SECTION ───────────────────────────────────────────────────────
  pageHeader:  'flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10',

  // ── GLOW / DECORATIVE ────────────────────────────────────────────────────
  glowBg:      'absolute inset-0 pointer-events-none',

} as const;

// ── Status badge helper ───────────────────────────────────────────────────
export const statusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'verified':
    case 'active':
    case 'in transit':
      return t.badgeGreen;
    case 'contacted':
      return t.badgeGreen;
    case 'pending':
    case 'new':
      return t.badgeAmber;
    case 'overdue':
    case 'rejected':
    case 'inactive':
    case 'closed':
      return t.badgeRed;
    default:
      return t.badgeNavy;
  }
};
