// The Library's general guides (the spec asks for splits and warm-up). Plain written content, no
// statistics: it says what is commonly done and why, and where DayLoad fits. Edit the words here.

export interface GuideSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface Guide {
  id: string
  title: string
  /** One line under the title in the list. */
  summary: string
  sections: GuideSection[]
}

export const GUIDES: Guide[] = [
  {
    id: 'splits',
    title: 'Training splits',
    summary: 'How to spread your muscle groups across the week.',
    sections: [
      {
        heading: 'What a split is',
        paragraphs: [
          'A split decides which muscles you train on which day. The common ones all work. The best one is the one you can keep doing week after week.',
          'DayLoad builds one muscle group per workout, so it fits splits that train one group per day best. That is what the timetable on the Plan tab holds: one muscle group or a rest for each weekday.',
        ],
      },
      {
        heading: 'The common splits',
        bullets: [
          'Full body, 2 to 3 days a week: every session works all the big muscle groups. Good for beginners and busy weeks. DayLoad builds one muscle group per workout, so it cannot plan a full-body session. Rotating a different group each day is the nearest fit.',
          'Upper and lower, 4 days a week: upper body one day, legs the next. In DayLoad, treat Chest and Back as your upper days and Legs as your lower day.',
          'Push, pull, legs, 3 to 6 days a week: pushing muscles (chest, shoulders, triceps) one day, pulling muscles (back, biceps) another, legs on the third. In DayLoad that is Chest or Shoulders, then Back, then Legs.',
          'Body-part split, 5 to 6 days a week: one muscle group per day. This is the closest match to how DayLoad plans a workout.',
        ],
      },
      {
        heading: 'A sample week to copy',
        paragraphs: ['Five training days, one muscle group each, with the weekend off. Set it on the Plan tab, under Timetable.'],
        bullets: ['Monday: Chest', 'Tuesday: Back', 'Wednesday: Legs', 'Thursday: Shoulders', 'Friday: Arms', 'Saturday and Sunday: Rest'],
      },
      {
        heading: 'Choosing one',
        bullets: [
          'Two or three days a week: spread chest, back and legs across them.',
          'Four days: add shoulders, or split your week into upper and lower days.',
          'Five or more days: a body-part split works well, and Core can fill a short session.',
          'Not sure? Pick the one you can keep up. You can change a day on the Plan tab at any time.',
        ],
      },
      {
        heading: 'Rest',
        paragraphs: [
          'Muscles recover between workouts, so most plans keep at least one full day off each week. If you train several days in a row, DayLoad suggests a rest day. You can always train anyway.',
        ],
      },
    ],
  },
  {
    id: 'warm-up',
    title: 'Warming up',
    summary: 'What to do in the first few minutes, and what the ramp-up sets are.',
    sections: [
      {
        heading: 'Why warm up',
        paragraphs: [
          'A warm-up gets you ready to lift: your heart rate and body temperature come up a little, and your muscles and joints move more freely. The aim is to feel ready, not tired.',
        ],
      },
      {
        heading: 'Three parts',
        bullets: [
          'Easy cardio, about 5 minutes: a bike, the rower or a brisk walk. You should still be able to talk.',
          'Movement for the muscles you are about to train: arm circles, bodyweight squats, leg swings. Go through a comfortable range and do not force it.',
          'Ramp-up sets of your first lift: a couple of lighter sets that lead up to your working weight.',
        ],
      },
      {
        heading: 'Ramp-up sets in DayLoad',
        paragraphs: [
          'Before your first exercise, DayLoad suggests lighter sets worked out from your target weight: about half of it for 8 reps, then about three quarters for 4 reps. The weights are rounded to 2.5 kg (5 lb).',
          'They are a suggestion only and are not saved with the workout. Rest only as long as you need. The rest of the exercises for the same muscle group are already warm, so the ramp-up is for the first lift.',
          'For a bodyweight exercise, one easy set, well short of what you usually do, does the same job. If you have no history for a lift yet, start with two light sets that feel easy.',
        ],
      },
      {
        heading: 'What to leave for later',
        paragraphs: [
          'Long static stretches, a minute or more on one muscle, are better saved for after the workout. Before lifting, keep the movement gentle and moving.',
        ],
      },
      {
        heading: 'If something feels wrong',
        paragraphs: [
          'A warm-up should never leave you tired. If it does, make it easier. On a cold or stiff day, take a few more minutes. Sharp pain is not something to warm up through: stop and rest, and see a professional if it stays.',
        ],
      },
    ],
  },
]

export const guideById = (id: string | undefined) => GUIDES.find((g) => g.id === id)
