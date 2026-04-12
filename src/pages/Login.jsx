import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // すでにログイン中の場合は管理画面へリダイレクトします。
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/admin", { replace: true });
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin", { replace: true });
    } catch (error) {
      alert("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>管理者ログイン</h1>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "14px" }}>
          <label style={{ display: "grid", gap: "6px", color: "#ddd" }}>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "#121212",
                color: "#fff"
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "6px", color: "#ddd" }}>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "#121212",
                color: "#fff"
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              background: "#4caf50",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p style={{ marginTop: "18px", color: "#888", fontSize: "14px" }}>
          管理者用のメールアドレスとパスワードでログインしてください。
        </p>
      </div>
    </div>
  );
}

export default Login;
