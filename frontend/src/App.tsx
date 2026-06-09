import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import { Video } from './screens/Video'
import Channel from "./screens/Channel.tsx"

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/watch' element={<Video />} />
          <Route path="/upload" element={<Home />} />
          <Route path='/channel/:username' element={<Channel />} />
        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
