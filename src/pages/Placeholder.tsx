/** A screen from the spec that a later phase builds. Says so plainly and shows nothing made up. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">{title}</h1>
      <p className="text-[15px] text-muted">Coming in a later phase</p>
    </>
  )
}
