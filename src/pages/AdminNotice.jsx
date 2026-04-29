import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { theme } from "../styles/theme";

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid " + theme.border,
  background: "#ffffff",
  color: theme.text,
  fontSize: "16px",
  boxSizing: "border-box"
};

const shadowStyle = "0 16px 32px rgba(15, 23, 42, 0.12)";

function AdminNotice() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || !body.trim() || !type) {
      alert("タイトル、本文、種別を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        body: body.trim(),
        type,
        target: "all",
        is_published: true,
        created_at: serverTimestamp(),
        published_at: serverTimestamp()
      });

      setTitle("");
      setBody("");
      setType("normal");
      alert("お知らせを投稿しました");
    } catch (error) {
      console.error(error);
      alert("お知らせの投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        padding: "20px",
        color: theme.text,
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
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>お知らせ投稿</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: theme.subText }}>
            保護者向けのお知らせを投稿します
          </div>
        </div>
        <button
          onClick={() => navigate("/admin")}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid " + theme.border,
            background: theme.card,
            color: theme.text,
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          戻る
        </button>
      </div>

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          background: theme.card,
          borderRadius: "16px",
          padding: "24px",
          boxShadow: shadowStyle
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "14px", fontWeight: "bold" }}>
            タイトル
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              placeholder="タイトルを入力"
            />
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "14px", fontWeight: "bold" }}>
            本文
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "180px",
                resize: "vertical",
                fontFamily: "inherit"
              }}
              placeholder="本文を入力"
            />
          </label>

          <label style={{ display: "grid", gap: "6px", fontSize: "14px", fontWeight: "bold" }}>
            種別
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              <option value="normal">通常</option>
              <option value="important">重要</option>
              <option value="cancel">中止・変更</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: theme.primary,
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminNotice;
