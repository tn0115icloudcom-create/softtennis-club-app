import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";

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

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlStudentId = searchParams.get("studentId");

  console.log("URLから取得したstudentId:", urlStudentId);

  // studentIdがない場合はエラー
  if (!urlStudentId) {
    return (
      <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: "420px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ color: "#f44336" }}>エラー</h1>
          <p>管理者から提供されたリンク経由でアクセスしてください。</p>
          <p style={{ fontSize: "14px", color: "#f44336" }}>studentIdが見つかりません</p>
        </div>
      </div>
    );
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name) {
        alert("保護者名を入力してください");
        setLoading(false);
        return;
      }
      // 既に登録されているかチェック
      const usersSnapshot = await getDocs(collection(db, "users"));

      let alreadyExists = false;

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        let ids = data.student_ids || [];

        if (!Array.isArray(ids)) {
          ids = [ids];
        }

        if (ids.includes(urlStudentId)) {
          alreadyExists = true;
        }
      });

      if (alreadyExists) {
        alert("この生徒は既に保護者登録されています");
        setLoading(false);
        return;
      }

      //==============================
      // Firebase Authに登録
      //==============================
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      //==============================
      // Firestoreに保存（超重要）
      //==============================
      console.log("Firestoreに保存するstudentId:", urlStudentId);
      await setDoc(doc(db, "users", user.uid), {
        email,
        role: "parent",
        student_ids: [urlStudentId], // URLから取得したstudentIdを配列で保存
        name: name
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
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            高橋キッズソフトテニスクラブ
          </div>
          <div style={{ fontSize: "13px", color: "#aaa", marginTop: "4px" }}>
            保護者アカウント登録
          </div>
        </div>

        {/* タイトル */}
        <h1 style={{
          fontSize: "20px",
          textAlign: "center",
          marginBottom: "16px"
        }}>
          新規登録
        </h1>

        {/* 説明 */}
        <p style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "14px",
          marginBottom: "20px"
        }}>
          パスワードは6～10文字で設定してください。
        </p>

        {/* フォーム */}
        <form onSubmit={handleRegister} style={{ display: "grid", gap: "14px" }}>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            style={inputStyle}
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：山田 太郎"
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
              background: "#2196f3",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "登録中..." : "登録する"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Register;
