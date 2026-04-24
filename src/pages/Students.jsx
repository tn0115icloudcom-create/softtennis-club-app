import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

//==============================
// JST日付変換
//==============================
const getJSTDate = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

//==============================
// 学年計算
//==============================
const calculateGrade = (gradeYear) => {
  const now = new Date();
  let grade = now.getFullYear() - gradeYear;

  // 4月未満ならまだ進級してない
  if (now.getMonth() < 3) {
    grade -= 1;
  }

  return Math.min(Math.max(grade, 1), 6);
};

function Students() {

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [remainings, setRemainings] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", gender: "male" });
  const [newGrade, setNewGrade] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [kana, setKana] = useState("");
  const navigate = useNavigate();

  //==============================
  // 生徒取得
  //==============================
  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, "students"));
      setStudents(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    };
    fetchStudents();
  }, []);

  //==============================
  // スケジュール取得
  //==============================
  useEffect(() => {
    const fetchSchedules = async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      setSchedules(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    };
    fetchSchedules();
  }, []);

  //==============================
  // 今日判定
  //==============================
  useEffect(() => {
    if (!schedules.length) return;

    const today = getJSTDate(new Date());

    const todayItem = schedules.find(item => {
      if (!item.date) return false;
      const itemDate = getJSTDate(item.date.toDate());
      return itemDate === today;
    });

    setTodaySchedule(todayItem || null);
  }, [schedules]);

  //==============================
  // 回数券取得（全生徒）
  //==============================
  useEffect(() => {
    const fetchTickets = async () => {
      if (!students.length) return;

      const ticketsSnapshot = await getDocs(collection(db, "tickets"));
      const ticketsData = {};
      ticketsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ticketsData[data.student_id] = (data.total || 0) - (data.used || 0);
      });

      setRemainings(ticketsData);
    };

    fetchTickets();
  }, [students]);

  //==============================
  // 参加処理
  //==============================
  const handleAttend = async (studentId) => {
    if (!todaySchedule) {
      alert("本日は練習がありません");
      return;
    }

    if (todaySchedule.status === "cancelled") {
      alert("本日は中止です");
      return;
    }

    if (!window.confirm("参加登録しますか？")) return;

    const today = getJSTDate(new Date());

    const q = query(
      collection(db, "attendance"),
      where("student_id", "==", studentId)
    );

    const snapshot = await getDocs(q);

    const already = snapshot.docs.some(doc => {
      const d = getJSTDate(doc.data().date.toDate());
      return d === today;
    });

    if (already) {
      alert("本日はすでに参加済みです");
      return;
    }

    const remaining = remainings[studentId] || 0;
    if (remaining <= 0) {
      alert("回数券がありません");
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

    const ticketSnap = await getDocs(ticketQuery);

    if (!ticketSnap.empty) {
      const t = ticketSnap.docs[0];
      await updateDoc(doc(db, "tickets", t.id), {
        used: (t.data().used || 0) + 1
      });
    }

    // remaining更新
    setRemainings(prev => ({
      ...prev,
      [studentId]: prev[studentId] - 1
    }));

    alert("参加登録しました");
  };

  //==============================
  // 生徒追加処理
  //==============================
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

      // 生徒リスト更新
      const snapshot = await getDocs(collection(db, "students"));
      setStudents(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

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

  return (
  <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>

    <div style={{
      background: "#1e1e1e",
      padding: "12px 16px",
      borderBottom: "1px solid #333",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{
          color: "#fff",
          fontSize: "clamp(16px, 5vw, 25px)",
          margin: 0
        }}>
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

      {students.map(s => (
        <div
          key={s.id}
          onClick={() => navigate(`/students/${s.id}`)}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "18px",
            margin: "12px 0",
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: "12px",
            cursor: "pointer"
          }}
        >

          {/* 上段：学年 + 名前 + 参加 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>

            <div>
              {/* ふりがな */}
              <div style={{ fontSize: "12px", color: "#bbb" }}>
                {s.kana || ""}
              </div>

              {/* 名前 + 学年 */}
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {s.grade ? `（${s.grade}年生） ` : "学年未設定 "}
                <span style={{
                  color: s.gender === "male" ? "#4fc3f7" : (s.gender === "female" ? "#f06292" : "#fff")
                }}>
                  {s.name}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAttend(s.id);
              }}
              disabled={(remainings[s.id] || 0) <= 0}
              style={{
                padding: "10px 20px",
                background: (remainings[s.id] || 0) > 0 ? "#4CAF50" : "#666",
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

          {/* 下段：回数券表示 */}
          <div style={{
            marginTop: "10px",
            fontSize: "14px",
            color: "#ccc"
          }}>
            回数券：残り {remainings[s.id] ?? 0}枚
          </div>

        </div>
      ))}

      {/* FAB（フローティングアクションボタン） */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: "#4CAF50",
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

      {/* 登録モーダル（ボトムシート） */}
      {isModalOpen && (
        <div style={{
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
        }}>
          <div style={{
            background: "#1e1e1e",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "20px 20px 0 0",
            padding: "24px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, color: "#fff" }}>新規生徒追加</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#ccc", marginBottom: "6px" }}>名前 *</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="生徒名"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#ccc", marginBottom: "6px" }}>ふりがな（任意）</label>
                <input
                  type="text"
                  value={kana}
                  onChange={(e) => setKana(e.target.value)}
                  placeholder="ふりがな（任意）"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#ccc", marginBottom: "6px" }}>性別</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ color: "#4fc3f7", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={newStudent.gender === "male"}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    /> 男性
                  </label>
                  <label style={{ color: "#f06292", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={newStudent.gender === "female"}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    /> 女性
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#ccc", marginBottom: "6px" }}>学年</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "10px",
                    background: "#121212",
                    color: "#fff",
                    border: "1px solid #333",
                    borderRadius: "8px"
                  }}
                >
                  <option value="">学年選択</option>
                  <option value="3">3年生</option>
                  <option value="4">4年生</option>
                  <option value="5">5年生</option>
                  <option value="6">6年生</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#ccc", marginBottom: "6px" }}>入会日</label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#4CAF50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                追加する
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Students;