function Placeholder({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="space-y-2">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-white/60">{detail}</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Placeholder
      title="Settings"
      detail="Emergency revoke-all AI access and account preferences."
    />
  );
}
