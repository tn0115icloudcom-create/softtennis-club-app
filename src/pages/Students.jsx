import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";

const getJSTDate = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
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

const getStudentCardStyle = (gender) => {
  if (gender === "male") {
    return {
      background: "linear-gradient(135deg, #1e88e5 0%, #42a5f5 55%, #64b5f6 100%)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 14px 28px rgba(30, 136, 229, 0.24)"
    };
  }

  if (gender === "female") {
    return {
      background: "linear-gradient(135deg, #ec407a 0%, #f06292 55%, #f48fb1 100%)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 14px 28px rgba(236, 64, 122, 0.22)"
    };
  }

  return {
    background: theme.card,
    color: theme.text,
    border: "1px solid " + theme.border,
    boxShadow: "none"
  };
};

function Students() {
  const location = useLocation();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [remainings, setRemainings] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", gender: "male" });
  const [newGrade, setNewGrade] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [kana, setKana] = useState("");

  useEffect(() => {
    if (location.state?.openAddStudent) {
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, "students"));
      setStudents(
        snapshot.docs.map((studentDoc) => ({
          id: studentDoc.id,
          ...studentDoc.data()
        }))
      );
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      setSchedules(
        snapshot.docs.map((scheduleDoc) => ({
          id: scheduleDoc.id,
          ...scheduleDoc.data()
        }))
      );
    };

    fetchSchedules();
  }, []);

  useEffect(() => {
    if (!schedules.length) return;

    const today = getJSTDate(new Date());
    const todayItem = schedules.find((item) => {
      if (!item.date) return false;
      return getJSTDate(item.date.toDate()) === today;
    });

    setTodaySchedule(todayItem || null);
  }, [schedules]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!students.length) return;

      const ticketsSnapshot = await getDocs(collection(db, "tickets"));
      const ticketsData = {};

      ticketsSnapshot.docs.forEach((ticketDoc) => {
        const data = ticketDoc.data();
        ticketsData[data.student_id] = (data.total || 0) - (data.used || 0);
      });

      setRemainings(ticketsData);
    };

    fetchTickets();
  }, [students]);

  const handleAttend = async (studentId) => {
    if (!todaySchedule) {
      alert("本日の予定がありません");
      return;
    }

    if (todaySchedule.status === "cancelled") {
      alert("本日は中止です");
      return;
    }

    if (!window.confirm("参加登録しますか？")) return;

    const today = getJSTDate(new Date());
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("student_id", "==", studentId)
    );

    const snapshot = await getDocs(attendanceQuery);
    const alreadyRegistered = snapshot.docs.some((attendanceDoc) => {
      const registeredDate = getJSTDate(attendanceDoc.data().date.toDate());
      return registeredDate === today;
    });

    if (alreadyRegistered) {
      alert("本日はすでに参加登録済みです");
      return;
    }

    const remaining = remainings[studentId] || 0;
    if (remaining <= 0) {
      alert("回数券残数がありません");
      return;
    }

    await addDoc(collection(db, "attendance"), {
      student_id: studentId,
      date: new Date(),
      status: "present"
    });

    const ticketQuery = query(
      collection(db, "tickets"),
      where("student_id", "==", studentId)
    );
    const ticketSnapshot = await getDocs(ticketQuery);

    if (!ticketSnapshot.empty) {
      const ticketDoc = ticketSnapshot.docs[0];
      await updateDoc(doc(db, "tickets", ticketDoc.id), {
        used: (ticketDoc.data().used || 0) + 1
      });
    }

    setRemainings((prev) => ({
      ...prev,
      [studentId]: prev[studentId] - 1
    }));

    alert("参加登録しました");
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.name.trim()) {
      alert("名前を入力してください");
      return;
    }

    try {
      await addDoc(collection(db, "students"), {
        name: newStudent.name,
        grade: newGrade ? Number(newGrade) : null,
        gender: newStudent.gender,
        kana: kana || "",
        join_date: joinDate || null,
        created_at: serverTimestamp()
      });

      const snapshot = await getDocs(collection(db, "students"));
      setStudents(
        snapshot.docs.map((studentDoc) => ({
          id: studentDoc.id,
          ...studentDoc.data()
        }))
      );

      setIsModalOpen(false);
      setNewStudent({ name: "", gender: "male" });
      setNewGrade("");
      setJoinDate("");
      setKana("");
      alert("生徒を追加しました");
    } catch (error) {
      console.error("追加エラー:", error);
      alert("追加に失敗しました");
    }
  };

  const handleCancel = () => {
    const confirmClose = window.confirm("入力内容は破棄されます。よろしいですか？");
    if (confirmClose) {
      setIsModalOpen(false);
    }
  };

  return (
    <div style={{ padding: "20px", background: theme.background, color: theme.text, minHeight: "100vh" }}>
      <div
        style={{
          background: theme.card,
          padding: "12px 16px",
          borderBottom: "1px solid " + theme.border
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1
            style={{
              color: theme.text,
              fontSize: "clamp(16px, 5vw, 25px)",
              margin: 0
            }}
          >
            生徒一覧
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/admin")}
              style={{
                padding: "6px 10px",
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: "6px"
              }}
            >
              ホーム
            </button>
          </div>
        </div>
      </div>

      {students.map((student) => (
        <div
          key={student.id}
          onClick={() => navigate(`/students/${student.id}`)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            padding: "18px",
            margin: "12px 0",
            borderRadius: "12px",
            cursor: "pointer",
            ...getStudentCardStyle(student.gender)
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", opacity: 0.86 }}>{student.kana || "ふりがな未設定"}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "6px" }}>{student.name}</div>
            <div style={{ fontSize: "16px", marginTop: "14px" }}>
              {student.grade ? `${student.grade}年生` : "学年未設定"}
            </div>
            <div style={{ fontSize: "16px", marginTop: "8px" }}>
              回数券残数: {remainings[student.id] ?? 0}回
            </div>
          </div>

          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAttend(student.id);
              }}
              disabled={(remainings[student.id] || 0) <= 0}
              style={{
                padding: "10px 20px",
                background: (remainings[student.id] || 0) > 0 ? "#4CAF50" : "#666",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              参加
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: theme.success,
          color: "#fff",
          border: "none",
          fontSize: "32px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}
      >
        +
      </button>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1001
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.card,
              width: "92%",
              maxWidth: "420px",
              margin: "0 auto",
              borderRadius: "20px 20px 0 0",
              padding: "24px 16px",
              boxSizing: "border-box",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: theme.text }}>新規生徒を追加</h2>
            </div>

            <form onSubmit={handleAddStudent} style={{ padding: "0 12px", boxSizing: "border-box" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: theme.subText, marginBottom: "6px" }}>名前 *</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="生徒名"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: theme.subText, marginBottom: "6px" }}>ふりがな</label>
                <input
                  type="text"
                  value={kana}
                  onChange={(e) => setKana(e.target.value)}
                  placeholder="ふりがな"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: theme.subText, marginBottom: "6px" }}>性別</label>
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  style={inputStyle}
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: theme.subText, marginBottom: "6px" }}>学年</label>
                <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} style={inputStyle}>
                  <option value="">学年を選択</option>
                  <option value="3">3年生</option>
                  <option value="4">4年生</option>
                  <option value="5">5年生</option>
                  <option value="6">6年生</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: theme.subText, marginBottom: "6px" }}>入会日</label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  style={dateInputStyle}
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
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#4caf50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                >
                  追加する
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#555",
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
