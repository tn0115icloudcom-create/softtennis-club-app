import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Admin from "./pages/Admin";
import AdminNotice from "./pages/AdminNotice";
import AdminSchedule from "./pages/AdminSchedule";
import Login from "./pages/Login";
import News from "./pages/News";
import Parent from "./pages/Parent";
import Schedule from "./pages/Schedule";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Register from "./pages/Register";
import ParentHistory from "./pages/ParentHistory";

function PlaceholderPage({ title }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f5f6f8",
        color: "#222222",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>{title}</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "#777777" }}>このページは準備中です。</div>
        </div>
        <button
          onClick={() => navigate("/parent")}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            background: "#ffffff",
            color: "#222222",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
          }}
        >
          ホーム
        </button>
      </div>

      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          padding: "24px",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
        }}
      >
        <p style={{ margin: 0, fontSize: "16px", color: "#777777" }}>このページは準備中です。</p>
      </div>
    </div>
  );
}

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
        <Route path="/admin/notices" element={<AdminNotice />} />
        <Route path="/admin/schedule" element={<AdminSchedule />} />

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
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/mypage" element={<PlaceholderPage title="マイページ" />} />
        <Route path="/news" element={<News />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
