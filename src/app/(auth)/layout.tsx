export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto grid min-h-screen max-w-[1100px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <div className="hidden lg:flex flex-col justify-center">
          <div className="max-w-md">
            <div className="text-xs font-medium text-muted-foreground">B2B Pricing Intelligence</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              A premium UX for market truth.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This is a frontend-only MVP with mock data, designed to feel like an enterprise-grade analytics
              product: fast, clean, and data-dense without being data-messy.
            </p>
            <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="font-medium text-fg">Keyboard first</div>
                <div className="mt-1">Visible focus rings, accessible controls, and no dark UX patterns.</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="font-medium text-fg">Two professional themes</div>
                <div className="mt-1">Office (default) and Colorful (accent-forward) — same layout & type.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  )
}
