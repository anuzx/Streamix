import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import { Video } from './screens/Video'
import UploadPage from './screens/UploadPage'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/watch' element={<Video />} />
          <Route path='/upload' element={<UploadPage />} />
        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
