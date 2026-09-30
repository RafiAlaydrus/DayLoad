import { TriangleAlert } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card role="alert" className="flex flex-col gap-3">
      <TriangleAlert size={26} strokeWidth={2} aria-hidden="true" />
      <h1 className="font-display text-[30px] font-bold leading-none">Something went wrong</h1>
      <p className="text-[15px] leading-relaxed text-muted">
        This screen hit an error. Try again, or reload the app. If you are in a private Safari tab, open DayLoad in a
        normal tab, because private tabs block the storage DayLoad needs.
      </p>
      <p className="break-words text-[13px] text-muted">{error.message}</p>
      <div className="mt-1 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onRetry}>
          Try again
        </Button>
        <Button className="flex-1" onClick={() => window.location.reload()}>
          Reload app
        </Button>
      </div>
    </Card>
  )
}

/** Catches render errors, including the ones dexie-react-hooks re-throws when a database read fails. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error) return <ErrorState error={error} onRetry={() => this.setState({ error: null })} />
    return this.props.children
  }
}
