import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AddClassPage from './pages/AddClassPage'
import ReviewPage from './pages/ReviewPage'
import TagTreePage from './pages/TagTreePage'
import ClassDetailPage from './pages/ClassDetailPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddClassPage />} />
        <Route path="/class/:id" element={<ClassDetailPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/tags" element={<TagTreePage />} />
      </Routes>
    </Layout>
  )
}

export default App
