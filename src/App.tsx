import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import ExerciseDetail from './pages/ExerciseDetail'
import Gyms from './pages/Gyms'
import HitTheGym from './pages/HitTheGym'
import Home from './pages/Home'
import Library from './pages/Library'
import NotFound from './pages/NotFound'
import Placeholder from './pages/Placeholder'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Summary from './pages/Summary'
import Workout from './pages/Workout'

export default function App() {
  return (
    // "user": when iOS Reduce Motion is on, slides and springs are skipped and only fades remain.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="hit-the-gym" element={<HitTheGym />} />
            <Route path="workout" element={<Workout />} />
            <Route path="summary/:sessionId" element={<Summary />} />
            <Route path="library" element={<Library />} />
            <Route path="library/:id" element={<ExerciseDetail />} />
            <Route path="gyms" element={<Gyms />} />
            {/* Built in a later phase. */}
            <Route path="plan" element={<Placeholder title="Plan" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
