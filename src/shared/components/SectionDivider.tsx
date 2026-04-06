export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted/60">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
