import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { ThemeSync } from './components/ThemeSync'
import ExerciseDetail from './pages/ExerciseDetail'
import Guide from './pages/Guide'
import Gyms from './pages/Gyms'
import HitTheGym from './pages/HitTheGym'
import Home from './pages/Home'
import Library from './pages/Library'
import NotFound from './pages/NotFound'
import Plan from './pages/Plan'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Summary from './pages/Summary'
import Workout from './pages/Workout'

export default function App() {
  return (
    // "user": when iOS Reduce Motion is on, slides and springs are skipped and only fades remain.
    <MotionConfig reducedMotion="user">
      <ThemeSync />
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="hit-the-gym" element={<HitTheGym />} />
            <Route path="workout" element={<Workout />} />
            <Route path="summary/:sessionId" element={<Summary />} />
            <Route path="library" element={<Library />} />
            <Route path="library/guides/:id" element={<Guide />} />
            <Route path="library/:id" element={<ExerciseDetail />} />
            <Route path="gyms" element={<Gyms />} />
            <Route path="plan" element={<Plan />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
