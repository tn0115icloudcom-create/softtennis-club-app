import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      //==============================
      // Firebase Authに登録
      //==============================
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      //==============================
      // Firestoreに保存（超重要）
      //==============================
      await setDoc(doc(db, "users", user.uid), {
        role: "parent",
        student_ids: [studentId] // 配列で保存
      });

      alert("登録完了しました。ログインしました。");
      navigate("/parent");

    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("このメールアドレスはすでに登録されています");
      } else if (error.code === "auth/weak-password") {
        alert("パスワードは6文字以上10文字以内にしてください");
      } else if (error.code === "auth/invalid-email") {
        alert("メールアドレスの形式が正しくありません");
      } else {
        alert("登録に失敗しました");
      }

    } finally {
    setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>

        <h1 style={{ textAlign: "center" }}>保護者登録</h1>

        <form onSubmit={handleRegister} style={{ display: "grid", gap: "14px" }}>

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px" }}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px" }}
          />

          <input
            type="text"
            placeholder="生徒ID（管理者からもらう）"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "8px"
            }}
          >
            {loading ? "登録中..." : "登録"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Register;