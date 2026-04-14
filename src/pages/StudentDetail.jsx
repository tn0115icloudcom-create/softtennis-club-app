import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);

  //==============================
  // 生徒情報取得
  //==============================
  useEffect(() => {
    const fetchStudent = async () => {
      const ref = doc(db, "students", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setStudent(snap.data());
      }
    };

    fetchStudent();
  }, [id]);

  //==============================
  // 参加履歴取得
  //==============================
  useEffect(() => {
    const fetchAttendance = async () => {
      const q = query(
        collection(db, "attendance"),
        where("student_id", "==", id)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 日付降順
      list.sort((a, b) => b.date.toDate() - a.date.toDate());

      setAttendance(list);
    };

    fetchAttendance();
  }, [id]);

  if (!student) return <div style={{ padding: 20 }}>読み込み中...</div>;

  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>

      {/* ヘッダー */}
      <div style={{
        position: "relative",
        marginBottom: "20px",
        textAlign: "center"
      }}>

        {/* 戻るボタン（左上固定） */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            background: "#444",
            color: "#fff",
            border: "none",
            padding: "6px 10px",
            borderRadius: "6px"
          }}
        >
          戻る
        </button>

         {/* タイトル */}
        <h1 style={{
          color: "#fff",
          fontSize: "22px",
          margin: 0
        }}>
          生徒詳細
        </h1>

      </div>

      {/* 生徒情報 */}
      <div style={{
        background: "#1e1e1e",
        padding: "16px",
        borderRadius: "12px",
        marginBottom: "20px"
      }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>
          {student.name}
        </div>

        <div style={{ marginTop: "8px", color: "#ccc" }}>
          性別：{student.gender || "未設定"}
        </div>

        <div style={{ marginTop: "8px", color: "#ccc" }}>
          備考：{student.note || "なし"}
        </div>
      </div>

      {/* 参加履歴 */}
      <div>
        <h2 style={{ marginBottom: "10px" }}>参加履歴</h2>

        {attendance.length === 0 && (
          <div style={{ color: "#888" }}>まだ参加履歴はありません</div>
        )}

        {attendance.map(a => (
          <div key={a.id} style={{
            background: "#1e1e1e",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "8px"
          }}>
            {a.date.toDate().toLocaleDateString()} - {a.status}
          </div>
        ))}
      </div>

    </div>
  );
}

export default StudentDetail;