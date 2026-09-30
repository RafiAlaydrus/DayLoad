import { ButtonLink } from '../components/ui/Button'

export default function NotFound() {
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">Page not found</h1>
      <p className="text-[15px] text-muted">There is no screen at this address.</p>
      <ButtonLink to="/" className="self-start">
        Back to Home
      </ButtonLink>
    </>
  )
}
