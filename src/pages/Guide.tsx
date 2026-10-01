import { ChevronLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { ButtonLink } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { IconLink } from '../components/ui/IconButton'
import { guideById } from '../content/guides'

/** One general guide from the Library, written in `content/guides.ts`. */
export default function Guide() {
  const guide = guideById(useParams().id)
  const back = (
    <IconLink to="/library?view=guides" label="Back to guides" outlined className="-ml-0.5">
      <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
    </IconLink>
  )

  if (!guide) {
    return (
      <>
        {back}
        <h1 className="font-display text-[34px] font-bold leading-none">Guide not found</h1>
        <Card>
          <p className="text-[15px] leading-relaxed">There is no guide with that address.</p>
          <ButtonLink to="/library?view=guides" className="mt-4">
            Back to guides
          </ButtonLink>
        </Card>
      </>
    )
  }

  return (
    <>
      {back}
      <div>
        <p className="text-[13px] font-semibold text-muted">Guide</p>
        <h1 className="mt-1 font-display text-[44px] font-bold leading-[0.95]">{guide.title}</h1>
      </div>
      {guide.sections.map((section) => (
        <Card key={section.heading}>
          <SectionLabel>{section.heading}</SectionLabel>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-2.5 text-[15px] leading-relaxed">
              {text}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {section.bullets.map((text) => (
                <li key={text} className="flex gap-3 text-[15px] leading-snug">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </>
  )
}
