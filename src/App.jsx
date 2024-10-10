import ZoomBot from "./assets/pages/ZoomBot";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="zoom/:id" element={<ZoomBot />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
