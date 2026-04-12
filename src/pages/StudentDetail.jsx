import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

function StudentDetail() {

  //==============================
  // パラメータ取得（URLのID）
  //==============================
  const { id } = useParams();

  //==============================
  // 画面状態
  //==============================
  const [student, setStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);

  const navigate = useNavigate();

  //==============================
  // 生徒情報取得
  //==============================
  useEffect(() => {
    const fetchStudent = async () => {
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStudent(docSnap.data());
      }
    };

    fetchStudent();
  }, [id]);

  //==============================
  // 回数券取得
  //==============================
  useEffect(() => {
    const fetchTicket = async () => {
      const q = query(
        collection(db, "tickets"),
        where("student_id", "==", id)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setRemaining((data.total || 0) - (data.used || 0));
      } else {
        setRemaining(0);
      }
    };

    fetchTicket();
  }, [id]);

  //==============================
  // UI
  //==============================
  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>

      {/* ヘッダー */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1>生徒詳細</h1>

        <button onClick={() => navigate("/students")}
          style={{
            padding: "6px 12px",
            background: "#444",
            color: "#fff",
            border: "none",
            borderRadius: "6px"
          }}
        >
          戻る
        </button>
      </div>

      {/* 名前 */}
      <div style={{
        padding: "20px",
        margin: "20px 0",
        background: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <h2 style={{ margin: 0 }}>
          {student ? student.name : "読み込み中..."}
        </h2>
      </div>

      {/* 回数券 */}
      <div style={{
        padding: "20px",
        margin: "20px 0",
        background: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "20px", margin: 0 }}>
          {remaining !== null
            ? `回数券：残り${remaining}枚`
            : "読み込み中..."}
        </p>
      </div>

      {/* 今後の拡張用スペース */}
      <div style={{
        padding: "20px",
        margin: "20px 0",
        background: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "12px",
        textAlign: "center",
        color: "#888"
      }}>
        <p>入会日：準備中</p>
        <p>練習回数：準備中</p>
      </div>

    </div>
  );
}

export default StudentDetail;