export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Typing</span>
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
