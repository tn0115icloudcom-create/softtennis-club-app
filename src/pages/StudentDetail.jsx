import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { theme } from "../styles/theme";

const getStatusLabel = (status) => {
  if (status === "present") return "参加";
  return status;
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  background: "#121212",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "10px",
  boxSizing: "border-box",
  fontSize: "16px"
};

const dateInputStyle = {
  ...inputStyle,
  width: "calc(100% - 24px)",
  maxWidth: "calc(100% - 24px)"
};

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [hasParent, setHasParent] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editKana, setEditKana] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editJoinDate, setEditJoinDate] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      const ref = doc(db, "students", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setStudent(data);
        setEditName(data.name || "");
        setEditKana(data.kana || "");
        setEditGrade(data.grade?.toString() || "");
        setEditJoinDate(data.join_date || "");
        setEditGender(data.gender || "");
        setEditNote(data.note || "");
      }
    };

    fetchStudent();
  }, [id]);

  useEffect(() => {
    const fetchRemainingCount = async () => {
      const snapshot = await getDocs(collection(db, "tickets"));
      let remaining = 0;

      snapshot.docs.forEach((ticketDoc) => {
        const data = ticketDoc.data();
        if (String(data.student_id) !== String(id)) return;

        remaining += Number(data.total ?? 0) - Number(data.used ?? 0);
      });

      setRemainingCount(remaining);
    };

    fetchRemainingCount();
  }, [id]);

  useEffect(() => {
    const checkParent = async () => {
      const snapshot = await getDocs(collection(db, "users"));

      let found = false;
      snapshot.docs.forEach((userDoc) => {
        const data = userDoc.data();
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

  useEffect(() => {
    const fetchAttendance = async () => {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("student_id", "==", id)
      );

      const snapshot = await getDocs(attendanceQuery);
      const list = snapshot.docs.map((attendanceDoc) => ({
        id: attendanceDoc.id,
        ...attendanceDoc.data()
      }));

      list.sort((a, b) => b.date.toDate() - a.date.toDate());
      setAttendance(list);
    };

    fetchAttendance();
  }, [id]);

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

  const handleCancel = () => {
    const confirmClose = window.confirm("入力内容は破棄されます。よろしいですか？");
    if (confirmClose) {
      setShowEditModal(false);
    }
  };

  if (!student) {
    return (
      <div
        style={{
          background: theme.background,
          color: theme.text,
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
    <div style={{ padding: "20px", background: theme.background, color: theme.text, minHeight: "100vh" }}>
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          textAlign: "center"
        }}
      >
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

        <h1
          style={{
            color: theme.text,
            fontSize: "22px",
            margin: 0
          }}
        >
          生徒詳細
        </h1>

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

      <div
        style={{
          background: theme.card,
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}
      >
        <div style={{ fontSize: "14px", color: theme.subText }}>{student.kana || "ふりがな未設定"}</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.text, marginTop: "6px" }}>
          {student.name}
        </div>
        <div style={{ marginTop: "14px", color: theme.text, fontSize: "16px" }}>
          {student.grade ? `${student.grade}年生` : "学年未設定"}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "16px",
            color:
              student.gender === "male"
                ? "#1e88e5"
                : student.gender === "female"
                  ? "#ec407a"
                  : theme.subText,
            fontWeight: "bold"
          }}
        >
          {student.gender === "male" ? "男性" : student.gender === "female" ? "女性" : "-"}
        </div>
        <div style={{ marginTop: "8px", color: theme.text, fontSize: "16px" }}>
          回数券残数: {remainingCount}回
        </div>
      </div>

      <div
        style={{
          background: theme.card,
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: theme.text }}>
          備考
        </div>
        <div
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: student.note ? theme.text : theme.subText,
            whiteSpace: "pre-wrap"
          }}
        >
          {student.note || "未設定"}
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          background: theme.card,
          padding: "16px",
          borderRadius: "12px"
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>保護者連携ステータス</div>

        <div
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: hasParent ? theme.success : theme.danger,
            color: "#fff",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "12px"
          }}
        >
          {hasParent ? "連携済み" : "未連携"}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: theme.subText,
            marginBottom: "12px",
            lineHeight: 1.6
          }}
        >
          リンクを保護者へ共有すると、この生徒に紐づく保護者ページを開設できます。
        </div>

        <button
          onClick={() => {
            const url = `${window.location.origin}/register?studentId=${id}`;
            navigator.clipboard.writeText(url);
            alert("保護者リンクをコピーしました");
          }}
          style={{
            width: "100%",
            padding: "14px",
            background: theme.primary,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          保護者リンクをコピー
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          background: theme.card,
          padding: "16px",
          borderRadius: "12px"
        }}
      >
        <h2
          style={{
            marginBottom: "10px",
            color: theme.text,
            fontSize: "22px"
          }}
        >
          参加履歴
        </h2>

        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          {attendance.length === 0 && <div style={{ color: "#888" }}>まだ参加履歴はありません</div>}

          {attendance.map((item) => (
            <div
              key={item.id}
              style={{
                background: theme.background,
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "8px"
              }}
            >
              {item.date.toDate().toLocaleDateString()} - {getStatusLabel(item.status)}
            </div>
          ))}
        </div>
      </div>

      {showEditModal && (
        <div
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
              width: "92%",
              maxWidth: "420px",
              margin: "0 auto",
              background: theme.card,
              borderRadius: "20px 20px 0 0",
              padding: "24px 16px",
              boxSizing: "border-box",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ textAlign: "center", color: theme.text, marginBottom: "20px" }}>生徒を編集</h2>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>名前</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="名前"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>ふりがな</label>
              <input
                value={editKana}
                onChange={(e) => setEditKana(e.target.value)}
                placeholder="ふりがな"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>学年</label>
              <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} style={inputStyle}>
                <option value="">学年</option>
                <option value="3">3年生</option>
                <option value="4">4年生</option>
                <option value="5">5年生</option>
                <option value="6">6年生</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>入会日</label>
              <input
                type="date"
                value={editJoinDate}
                onChange={(e) => setEditJoinDate(e.target.value)}
                style={dateInputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>性別</label>
              <select value={editGender} onChange={(e) => setEditGender(e.target.value)} style={inputStyle}>
                <option value="">性別</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: theme.subText, marginBottom: "4px", fontSize: "12px" }}>備考</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="備考"
                style={{
                  ...inputStyle,
                  height: "80px",
                  resize: "none"
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px"
              }}
            >
              <button
                onClick={handleUpdateStudent}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: theme.success,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                更新する
              </button>

              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: theme.subText,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
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
