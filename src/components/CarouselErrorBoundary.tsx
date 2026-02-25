import type { ErrorInfo } from 'react'
import { Component } from 'react'
import type {
  CarouselErrorBoundaryProps,
  CarouselErrorBoundaryState,
} from '@/types/carousel'

export class CarouselErrorBoundary extends Component<
  CarouselErrorBoundaryProps,
  CarouselErrorBoundaryState
> {
  state: CarouselErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CarouselErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CarouselErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          aria-label="Image carousel"
          className="w-full rounded-3xl border border-danger/40 bg-lacquer/90 p-8 shadow-rail"
        >
          <p className="font-body text-sm uppercase tracking-[0.24em] text-danger">
            Something went wrong
          </p>
          <p className="mt-2 font-body text-sm text-muted">
            The carousel encountered an unexpected error.
          </p>
          <button
            className="mt-5 rounded-xl border border-gold/55 px-4 py-2 font-body text-sm text-ivory transition hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
            onClick={this.handleRetry}
            type="button"
          >
            Retry
          </button>
        </section>
      )
    }

    return this.props.children
  }
}
