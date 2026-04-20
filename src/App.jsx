import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Parent from "./pages/Parent";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Register from "./pages/Register";
import ParentHistory from "./pages/ParentHistory";

function PrivateRoute({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  if (!isReady) {
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 管理画面（ログイン必須） */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />

        {/* ログイン画面 */}
        <Route path="/login" element={<Login />} />

        {/* 保護者画面 */}
        <Route path="/parent" element={<Parent />} />

        {/* 生徒一覧 */}
        <Route path="/students" element={<Students />} />

        {/* 生徒詳細 */}
        <Route path="/students/:id" element={<StudentDetail />} />

        {/* ルートまたは不明なパスはログインへ */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* 新規登録画面へ */}
        <Route path="/register" element={<Register />} />

        {/* 保護者履歴画面へ */}
        <Route path="/parent/history/:studentId" element={<ParentHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;