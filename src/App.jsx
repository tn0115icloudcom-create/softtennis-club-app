import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Parent from "./pages/Parent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/parent/:id" element={<Parent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;