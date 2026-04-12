import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from "firebase/firestore";
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

function Students() {

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [remainings, setRemainings] = useState({});
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

  return (
  <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>

    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <h1 style={{ color: "#fff" }}>生徒一覧</h1>

      <button
        onClick={() => navigate("/admin")}
        style={{
          padding: "8px 12px",
          background: "#444",
          color: "#fff",
          border: "none",
          borderRadius: "6px"
        }}
      >
        ホーム
      </button>
    </div>

      {students.map(s => (
        <div
          key={s.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px",
            margin: "12px 0",
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: "12px",
            fontSize: "20px",
            color: "#fff",
            fontWeight: "bold"
          }}
        >
          <div
            onClick={() => navigate(`/students/${s.id}`)}
            style={{ cursor: "pointer", flex: 1 }}
          >
            {s.name}
          </div>
          <button
            onClick={() => handleAttend(s.id)}
            disabled={(remainings[s.id] || 0) <= 0}
            style={{
              padding: "10px 20px",
              background: (remainings[s.id] || 0) > 0 ? "#4CAF50" : "#666",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: (remainings[s.id] || 0) > 0 ? "pointer" : "not-allowed"
            }}
          >
            参加
          </button>
        </div>
      ))}

    </div>
  );
}

export default Students;