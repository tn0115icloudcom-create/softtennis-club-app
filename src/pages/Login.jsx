import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #333",
  background: "#121212",
  color: "#fff",
  fontSize: "16px",
  boxSizing: "border-box"
};

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
    <div style={{
      minHeight: "100vh",
      background: "#121212",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#1e1e1e",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #333"
      }}>

        {/* アプリ名 */}
        <div style={{
          textAlign: "center",
          marginBottom: "10px"
        }}>
          <div style={{
            fontSize: "20px",
            fontWeight: "bold"
          }}>
            高橋キッズソフトテニスクラブ
          </div>

          <div style={{
            fontSize: "13px",
            color: "#aaa",
            marginTop: "4px"
          }}>
            ［スケジュール確認アプリ］
          </div>
        </div>


        {/* サブ説明 */}
        <p style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "10px",
          marginBottom: "20px"
        }}>
          メールアドレスとパスワードを入力してください
        </p>

        {/* フォーム */}
        <form onSubmit={handleLogin} style={{ display: "grid", gap: "14px" }}>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            style={inputStyle}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            style={inputStyle}
          />

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

      </div>
    </div>
  );
}

export default Login;
