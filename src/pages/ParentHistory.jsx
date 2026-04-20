import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

function ParentHistory() {
  const [histories, setHistories] = useState([]);
  const navigate = useNavigate();
  const { studentId } = useParams();

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  const fetchHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (!studentId) return;

      // users取得（修正）
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("ユーザー情報が見つかりません");
        return;
      }

      const userData = userSnap.data();
      const studentIds = userData.student_ids || [];

      console.log("userData:", userData);
      console.log("studentIds:", studentIds);

      // 空対策（重要）
      if (!studentIds.length) {
        setHistories([]);
        return;
      }

      // attendance取得
      const snapshot = await getDocs(collection(db, "attendance"));

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("attendance全件:", list);

      const filtered = list.filter(item => {
        const sid = Array.isArray(item.student_id)
          ? item.student_id[0]
          : item.student_id;

        return String(sid) === String(studentId);
      });

      console.log("filtered:", filtered);

      setHistories(filtered);

    } catch (error) {
      console.error(error);
      alert("履歴取得に失敗しました");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#121212",
      color: "#fff",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* ヘッダー（固定） */}
      <div style={{
        flexShrink: 0,
        padding: "20px",
        background: "#121212",
        borderBottom: "1px solid #333"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginRight: "10px",
              background: "#333",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: "8px"
            }}
          >
            ← 戻る
          </button>

          <h2 style={{ margin: 0 }}>参加履歴</h2>
        </div>
      </div>

      {/* 履歴一覧（スクロール可能） */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto"
      }}>
        {histories.length === 0 ? (
          <p style={{ color: "#aaa" }}>履歴がありません</p>
        ) : (
          histories.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#1e1e1e",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "10px"
              }}
            >
              <div>
                {item.date?.toDate().toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  weekday: "short"
                })}
              </div>
              <div style={{ color: "#aaa" }}>
                {item.status === "present" ? "参加" : "欠席"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParentHistory;