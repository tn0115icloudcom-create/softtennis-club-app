import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

const getStatusLabel = (status) => {
  if (status === "present") return "参加";
  return status;
};

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [hasParent, setHasParent] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editKana, setEditKana] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editJoinDate, setEditJoinDate] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editNote, setEditNote] = useState("");

  //==============================
  // 生徒情報取得
  //==============================
  useEffect(() => {
    const fetchStudent = async () => {
      const ref = doc(db, "students", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setStudent(snap.data());
        setEditName(snap.data().name || "");
        setEditKana(snap.data().kana || "");
        setEditGrade(snap.data().grade?.toString() || "");
        setEditJoinDate(snap.data().join_date || "");
        setEditGender(snap.data().gender || "");
        setEditNote(snap.data().note || "");
      }
    };

    fetchStudent();
  }, [id]);

  useEffect(() => {
    const checkParent = async () => {
      const snapshot = await getDocs(collection(db, "users"));

      let found = false;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        let ids = data.student_ids || [];

        if (!Array.isArray(ids)) {
          ids = [ids];
        }

        if (ids.includes(id)) {
          found = true;
        }
      });

      setHasParent(found);
    };

    checkParent();
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

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // 日付降順
      list.sort((a, b) => b.date.toDate() - a.date.toDate());

      setAttendance(list);
    };

    fetchAttendance();
  }, [id]);

  //==============================
  // 生徒更新処理
  //==============================
  const handleUpdateStudent = async () => {
    try {
      await updateDoc(doc(db, "students", id), {
        name: editName,
        kana: editKana,
        grade: editGrade ? Number(editGrade) : null,
        join_date: editJoinDate || null,
        gender: editGender,
        note: editNote
      });

      // 生徒情報再取得
      const ref = doc(db, "students", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStudent(snap.data());
      }

      setShowEditModal(false);
      alert("更新しました");
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
    }
  };

  if (!student) {
    return (
      <div
        style={{
          background: "#121212",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          textAlign: "center"
        }}
      >
        {/* 戻るボタン */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: "0",
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
        <h1
          style={{
            color: "#fff",
            fontSize: "22px",
            margin: 0
          }}
        >
          生徒詳細
        </h1>

        {/* 編集ボタン */}
        <button
          onClick={() => setShowEditModal(true)}
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            padding: "8px 12px",
            background: "#2196f3",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          編集
        </button>
      </div>

      {/* 生徒情報 */}
      <div
        style={{
          background: "#1e1e1e",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}
      >
        <div style={{ fontSize: "14px", color: "#bbb" }}>
          {student.kana || "ふりがな未設定"}
        </div>

        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", marginTop: "4px" }}>
          {student.grade ? `${student.grade}年生 ` : "学年未設定 "}
          {student.name}
        </div>

        <div style={{ marginTop: "12px", color: "#ccc", fontSize: "14px" }}>
          <div>性別：{student.gender === "male" ? "男性" : student.gender === "female" ? "女性" : "-"}</div>
          {student.note && <div style={{ marginTop: "4px" }}>備考：{student.note}</div>}
        </div>
      </div>

      {/* 保護者セクション */}
      <div
        style={{
          marginTop: "20px",
          background: "#1e1e1e",
          padding: "16px",
          borderRadius: "12px"
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>保護者</div>

        <div
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: hasParent ? "#1b5e20" : "#5c0000",
            color: "#fff",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "12px"
          }}
        >
          {hasParent ? "登録済み" : "未登録"}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#ccc",
            marginBottom: "12px",
            lineHeight: 1.6
          }}
        >
          リンクを保護者の方に作成したURLを共有して下さい。
        </div>

        <button
          onClick={() => {
            const url = `${window.location.origin}/register?studentId=${id}`;
            navigator.clipboard.writeText(url);
            alert("招待リンクを作成してコピーしました");
          }}
          style={{
            width: "100%",
            padding: "14px",
            background: "#2196f3",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          招待リンク作成
        </button>
      </div>

      {/* 参加履歴 */}
      <div
        style={{
          marginTop: "20px",
          background: "#1e1e1e",
          padding: "16px",
          borderRadius: "12px"
        }}
      >
        <h2
          style={{
            marginBottom: "10px",
            color: "#fff",
            fontSize: "22px"
          }}
        >
          参加履歴
        </h2>

        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          {attendance.length === 0 && (
            <div style={{ color: "#888" }}>まだ参加履歴はありません</div>
          )}

          {attendance.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#2a2a2a",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "8px"
              }}
            >
              {a.date.toDate().toLocaleDateString()} - {getStatusLabel(a.status)}
            </div>
          ))}
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#1e1e1e",
              borderRadius: "16px 16px 0 0",
              padding: "20px 16px",
              boxSizing: "border-box",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "20px" }}>生徒編集</h2>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>名前</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="名前"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>ふりがな</label>
              <input
                value={editKana}
                onChange={(e) => setEditKana(e.target.value)}
                placeholder="ふりがな"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>学年</label>
              <select
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              >
                <option value="">学年</option>
                <option value="3">3年生</option>
                <option value="4">4年生</option>
                <option value="5">5年生</option>
                <option value="6">6年生</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>入会日</label>
              <input
                type="date"
                value={editJoinDate}
                onChange={(e) => setEditJoinDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>性別</label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              >
                <option value="">性別</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px", fontSize: "12px" }}>備考</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="備考"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  height: "80px",
                  resize: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                onClick={handleUpdateStudent}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#4CAF50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                保存
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDetail;
