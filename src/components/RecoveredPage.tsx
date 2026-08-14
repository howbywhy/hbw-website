export function RecoveredPage({ html }: { html: string }) {
  return (
    <div
      id="hbw-recovered"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
