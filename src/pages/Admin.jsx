import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

//==============================
// カレンダー用関数
//==============================

// 月の日数取得
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// 曜日取得
const getWeekday = (date) => {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
};

// カレンダー生成
const generateCalendar = (year, month) => {
  const days = [];
  const total = getDaysInMonth(year, month);

  for (let i = 1; i <= total; i++) {
    days.push(new Date(year, month, i));
  }

  return days;
};

function App() {

  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());

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
  // 月変更処理
  //==============================
  const changeMonth = (diff) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + diff);
    setCurrentDate(newDate);
  };

  //==============================
  // 一覧画面
  //==============================
  if (!selectedStudent) {
    return (
      <div style={{ padding: "20px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ color: "#fff" }}>高橋キッズソフトテニスクラブ</h1>

          <button
            onClick={() => navigate("/students")}
            style={{
              padding: "8px 12px",
              background: "#444",
              color: "#fff",
              border: "none",
              borderRadius: "6px"
            }}
          >
            生徒一覧
          </button>
        </div>

        {viewMode === "students" && (
          <div>

            {/* ヘッダー */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <h2 style={{ color: "#fff" }}>生徒一覧</h2>

              <button
                onClick={() => setViewMode("home")}
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

            {/* 生徒リスト */}
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

          </div>
        )}

        {/* ==============================
        今日の練習カード
        ============================== */}
        <h2 style={{ color: "#fff" }}>本日の練習</h2>
        <div style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #1f1d1e",
          background: "#fcf9f9",
          textAlign: "center"
        }}>

          {/* 日付 */}
          <div style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#0a0a0a",
            marginBottom: "10px"
          }}>
            {todaySchedule &&
              todaySchedule.date.toDate().toLocaleDateString() + "（" +
              ["日","月","火","水","木","金","土"][todaySchedule.date.toDate().getDay()] + "）"
            }
          </div>

          {/* 状態（超重要） */}
          <div style={{
            marginTop: "8px",
            fontSize: "28px",
            fontWeight: "bold",
            color: todaySchedule
              ? (todaySchedule.status === "scheduled" ? "#0c8cf5" : "#ff1744")
              : "#888"
          }}>
            {todaySchedule
              ? (todaySchedule.status === "scheduled" ? "実施" : "中止")
              : "なし"}
          </div>

        </div>

        {/* ==============================
        区切り
        ============================== */}
        <div style={{
          marginTop: "30px",
          marginBottom: "10px",
          borderTop: "1px solid #444"
        }}></div>
        

        <h2 style={{ color: "#fff" }}>スケジュール</h2>
        {/* ==============================
        切替ボタン
        ============================== */}
        <div style={{ display: "flex", margin: "10px 0" }}>
          <button
            onClick={() => setViewMode("list")}
            style={{
              flex: 1,
              padding: "12px",
              background: viewMode === "list" ? "#ff6d00" : "#444",
              color: "#fff",
              border: "none"
            }}
          >
            一覧
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            style={{
              flex: 1,
              padding: "12px",
              background: viewMode === "calendar" ? "#ff6d00" : "#444",
              color: "#fff",
              border: "none"
            }}
          >
            カレンダー
          </button>
        </div>

       {/* ==============================
         カレンダーUI
        ============================== */}
        {viewMode === "calendar" && (() => {

          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();

          const startDay = new Date(year, month, 1).getDay();
          const days = generateCalendar(year, month);

          return (
            <div>

              {/* 月切替ヘッダー */} 
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                color: "#fff"
              }}>
                <button onClick={() => changeMonth(-1)}>◀</button>

                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {year}年{month + 1}月
                </div>

                <button onClick={() => changeMonth(1)}>▶</button>
              </div>

              {/* 今月ボタン */}
              <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    background: "#444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px"
                  }}
                >
                  今月に戻る
                </button>
              </div>

              {/* 曜日 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                marginBottom: "5px"
              }}>
                {["日","月","火","水","木","金","土"].map(d => (
                  <div key={d} style={{ textAlign: "center", color: "#aaa" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* カレンダー */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "6px"
              }}>

                {/* 空白 */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={"blank" + i}></div>
                ))}

                {/* 日付 */}
                {days.map(date => {

                  const dateStr = getJSTDate(date);
                  const todayStr = getJSTDate(new Date());
                  const isToday = dateStr === todayStr;

                  const schedule = schedules.find(s => {
                    if (!s.date) return false;
                    return getJSTDate(s.date.toDate()) === dateStr;
                  });

                  return (
                    <div
                      key={date}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: isToday ? "3px solid #f305e7" : "none",
                        textAlign: "center",
                        background:
                          schedule
                            ? (schedule.status === "scheduled" ? "#69f0ae" : "#ff8a80")
                            : "#222",
                        color: "#fff"
                      }}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}

              </div>
            </div>
          );
        })()}

       {/* ==============================
         スケジュール一覧
        ============================== */}
        {viewMode === "list" &&
          schedules
            // 今日以降だけ
            .filter(item => {
              if (!item.date) return false;
              const today = getJSTDate(new Date());
              const itemDate = getJSTDate(item.date.toDate());
              return itemDate >= today;
            })
            // 日付順に並び替え
            .sort((a, b) => a.date.toDate() - b.date.toDate())
            // 最大10件
            .slice(0, 10)
            .map(item => (

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
            {item.date.toDate().toLocaleDateString()}（{
              ["日","月","火","水","木","金","土"][item.date.toDate().getDay()]
            }）
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