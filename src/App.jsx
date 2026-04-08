import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Parent from "./pages/Parent";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 管理画面 */}
        <Route path="/admin" element={<Admin />} />

        {/* 保護者画面 */}
        <Route path="/parent/:id" element={<Parent />} />

        {/* 生徒一覧 */}
        <Route path="/students" element={<Students />} />

        {/* 生徒詳細 */}
        <Route path="/students/:id" element={<StudentDetail />} />

        {/* デフォルト */}
        <Route path="*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;