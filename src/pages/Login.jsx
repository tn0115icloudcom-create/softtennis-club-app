import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // roleに基づいてリダイレクトする関数（デバッグ付き）
const redirectBasedOnRole = async (uid) => {
  try {
    console.log("UID:", uid);

    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    console.log("exists:", userDocSnap.exists());

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      console.log("userData:", userData);

      const role = userData.role;
      console.log("role:", role);

      if (role === "admin") {
        console.log("→ adminへ");
        navigate("/admin", { replace: true });
      } else if (role === "parent") {
        console.log("→ parentへ");
        navigate("/parent", { replace: true });
      } else {
        console.log("→ role不明");
        navigate("/admin", { replace: true });
      }
    } else {
      console.log("→ usersにデータなし");
      navigate("/admin", { replace: true });
    }
  } catch (error) {
    console.error("🔥 role取得エラー:", error);
    navigate("/admin", { replace: true });
  }
};

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Firebase Authenticationでログイン
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ログイン成功後、roleに基づいてリダイレクト
      await redirectBasedOnRole(user.uid);
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
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>ログイン</h1>

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
          メールアドレスとパスワードでログインしてください。
        </p>

        <p style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/register")}>
            新規登録はこちら
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;
