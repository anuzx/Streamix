import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import { Video } from './screens/Video'
import Channel from "./screens/Channel.tsx"
import Signup from './screens/Signup.tsx'
import Signin from './screens/Signin.tsx'
import UploadPage from './components/upload/UploadPage'
import { useUploadStore } from './store/uploadStore'

function App() {
  const { isOpen } = useUploadStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/watch' element={<Video />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path='/channel/:username' element={<Channel />} />
      </Routes>

      {isOpen && <UploadPage />}
    </BrowserRouter>
  )
}

export default App
