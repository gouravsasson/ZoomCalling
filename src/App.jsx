import ZoomBot from "./assets/pages/ZoomBot"
import { BrowserRouter as Router,Route,Routes } from "react-router-dom"
import { Router } from './../node_modules/@remix-run/router/dist/router.d';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
          <Route path="/:id" element={<ZoomBot />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
