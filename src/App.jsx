import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Parent from "./pages/Parent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 管理画面 */}
        <Route path="/admin" element={<Admin />} />

        {/* 保護者画面 */}
        <Route path="/parent/:id" element={<Parent />} />

        {/* デフォルト */}
        <Route path="*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;