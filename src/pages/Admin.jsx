import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc
} from "firebase/firestore";

//==============================
// JST日付変換
//==============================
const getJSTDate = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

function App() {

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);

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
  // 回数券取得
  //==============================
  useEffect(() => {
    const fetchTicket = async () => {
      if (!selectedStudent) return;

      const q = query(
        collection(db, "tickets"),
        where("student_id", "==", selectedStudent.id)
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
  }, [selectedStudent]);

  //==============================
  // 参加処理
  //==============================
  const handleAttend = async () => {

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
      where("student_id", "==", selectedStudent.id)
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

    if (remaining <= 0) {
      alert("回数券がありません");
      return;
    }

    await addDoc(collection(db, "attendance"), {
      student_id: selectedStudent.id,
      date: new Date(),
      status: "present"
    });

    const ticketQuery = query(
      collection(db, "tickets"),
      where("student_id", "==", selectedStudent.id)
    );

    const ticketSnap = await getDocs(ticketQuery);

    if (!ticketSnap.empty) {
      const t = ticketSnap.docs[0];
      await updateDoc(doc(db, "tickets", t.id), {
        used: (t.data().used || 0) + 1
      });
    }

    setRemaining(prev => prev - 1);
    alert("参加登録しました");
  };

  //==============================
  // 一覧画面
  //==============================
  if (!selectedStudent) {
    return (
      <div style={{ padding: "20px" }}>

        <h1 style={{ textAlign: "center", color: "#fff" }}>生徒一覧</h1>

        {students.map(s => (
          <div
            key={s.id}
            onClick={() => setSelectedStudent(s)}
            style={{
              padding: "18px",
              margin: "12px 0",
              background: "#fff",
              borderRadius: "12px",
              fontSize: "20px",
              textAlign: "center",
              color: "#000",
              fontWeight: "bold"
            }}
          >
            {s.name}
          </div>
        ))}

        {/* 日付 */}
        <div style={{
          marginTop: "20px",
          fontSize: "18px",
          textAlign: "center",
          color: "#ccc"
        }}>
          {todaySchedule && todaySchedule.date.toDate().toLocaleDateString()}
        </div>

        {/* 状態 */}
        <div style={{
          margin: "10px 0",
          fontSize: "26px",
          fontWeight: "bold",
          textAlign: "center",
          color: todaySchedule
            ? (todaySchedule.status === "scheduled" ? "#00e676" : "#ff1744")
            : "#888"
        }}>
          本日の練習：
          {todaySchedule
            ? (todaySchedule.status === "scheduled" ? "実施" : "中止")
            : "なし"}
        </div>

        <h2 style={{ color: "#fff" }}>スケジュール</h2>

        {schedules.map(item => (
          <div
            key={item.id}
            style={{
              padding: "14px",
              margin: "12px 0",
              background: item.status === "cancelled" ? "#ffcdd2" : "#fff",
              borderRadius: "10px",
              color: "#000",
              fontWeight: "bold"
            }}
          >
            {item.date.toDate().toLocaleDateString()}
            <br />
            {item.title}（{item.start_time}）
            <br />
            ステータス：{item.status === "scheduled" ? "実施" : "中止"}
          </div>
        ))}

      </div>
    );
  }

  //==============================
  // 🔽 詳細画面
  //==============================
  return (
    <div style={{ padding: "20px" }}>

      <h1 style={{ textAlign: "center", color: "#fff" }}>
        {selectedStudent.name}
      </h1>

      <p style={{
        fontSize: "24px",
        textAlign: "center",
        margin: "20px 0",
        color: "#fff"
      }}>
        回数券：残り{remaining}枚
      </p>

      {/* 参加ボタン（主操作） */}
      <button
        onClick={handleAttend}
        disabled={remaining <= 0}
        style={{
          padding: "20px",
          fontSize: "20px",
          width: "100%",
          background: remaining <= 0 ? "#555" : "#ff6d00",
          borderRadius: "12px",
          color: "#fff",
          border: "none"
        }}
      >
        参加
      </button>

      {/* 戻るボタン（副操作） */}
      <div style={{ marginTop: "10px", textAlign: "right" }}>
        <button
          onClick={() => setSelectedStudent(null)}
          style={{
            padding: "8px 30px",
            fontSize: "14px"
          }}
        >
          戻る
        </button>
      </div>

    </div>
  );
}

export default App;