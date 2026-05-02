import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Teacher from './pages/Teacher'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/exam" element={<Exam />} />
      <Route path="/teacher" element={<Teacher />} />
    </Routes>
  )
}
