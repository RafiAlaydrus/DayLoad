import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Placeholder from './pages/Placeholder'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

export default function App() {
  return (
    // "user": when iOS Reduce Motion is on, slides and springs are skipped and only fades remain.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            {/* Screens from the spec that later phases build. */}
            <Route path="hit-the-gym" element={<Placeholder title="Hit the gym" />} />
            <Route path="workout" element={<Placeholder title="Workout" />} />
            <Route path="summary" element={<Placeholder title="Session summary" />} />
            <Route path="plan" element={<Placeholder title="Plan" />} />
            <Route path="library" element={<Placeholder title="Library" />} />
            <Route path="gyms" element={<Placeholder title="Gyms" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
