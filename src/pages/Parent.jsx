import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import HeaderMenu from "../components/HeaderMenu";

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
// 曜日
//==============================
const getWeekday = (date) => {
  const days = ["日","月","火","水","木","金","土"];
  return days[date.getDay()];
};

//==============================
// カレンダー生成
//==============================
const generateCalendar = (year, month) => {
  const days = [];
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= total; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

const menuItemStyle = {
  padding: "12px",
  borderBottom: "1px solid #333",
  cursor: "pointer",
  color: "#fff"
};

function Parent() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({});
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [remainings, setRemainings] = useState({});
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);

  //==============================
  // ログインユーザー取得
  //==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const fetchedUserData = userSnap.data();
      setUserData(fetchedUserData);

      let studentIds = fetchedUserData.student_ids || [];

      if (!Array.isArray(studentIds)) {
        studentIds = [studentIds];
      }

      // students取得
      const snapshot = await getDocs(collection(db, "students"));

      const list = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(s => studentIds.includes(s.id));

      setStudents(list);
    });

    return () => unsubscribe();
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
  // 回数券残数取得
  //==============================
  useEffect(() => {
    const fetchTicketRemainings = async () => {
      const snapshot = await getDocs(collection(db, "tickets"));
      const map = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const studentId = data.student_id;
        if (!studentId) return;

        const total = Number(data.total ?? 0);
        const used = Number(data.used ?? 0);
        const remaining = total - used;

        map[studentId] = (map[studentId] || 0) + remaining;
      });

      setRemainings(map);
      setTicketsLoaded(true);
    };

    fetchTicketRemainings();
  }, []);

  //==============================
  // 今日の練習
  //==============================
  useEffect(() => {
    if (!schedules.length) return;

    const today = getJSTDate(new Date());

    const todayItem = schedules.find(item => {
      if (!item.date) return false;
      return getJSTDate(item.date.toDate()) === today;
    });

    setTodaySchedule(todayItem || null);
  }, [schedules]);

  //==============================
  // 月変更
  //==============================
  const changeMonth = (diff) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + diff);
    setCurrentDate(newDate);
  };

  //==============================
  // ログアウト
  //==============================
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  
  return (
    <div style={{ padding: "20px", background: "#121212", minHeight: "100vh", color: "#fff" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px"
      }}>
        <h1 style={{ margin: 0 }}>保護者ページ</h1>

        <HeaderMenu>
          <div style={menuItemStyle}>
            マイページ
          </div>

          <div style={{ ...menuItemStyle, color: "#f44336" }} onClick={handleLogout}>
            ログアウト
          </div>
        </HeaderMenu>
      </div>

      {/* 保護者名表示 */}
      <div style={{
        background: "#1e1e1e",
        padding: "14px 16px",
        borderRadius: "12px",
        marginBottom: "16px"
      }}>
        <div style={{
          fontSize: "14px",
          color: "#aaa"
        }}>
          保護者アカウント
        </div>

        <div style={{
          fontSize: "18px",
          fontWeight: "bold",
          marginTop: "4px"
        }}>
          {(userData.name || userData.email || "保護者") + " さん"}
        </div>
      </div>

      {/* タイトルとメニュー */}
      {/* =========================
        今日の練習
      ========================= */}
      <div style={{
        marginTop: "20px",
        padding: "20px",
        borderRadius: "12px",
        background: "#1e1e1e",
        textAlign: "center"
      }}>

        <div style={{
          fontSize: "30px",
          fontWeight: "bold",
          color: "#aaa",
          marginBottom: "20px"
        }}>
          《本日の活動》
        </div>

        <div style={{ fontSize: "18px" }}>
          {new Date().toLocaleDateString() + "（" + getWeekday(new Date()) + "）"}
        </div>

        <div style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginTop: "10px",
          color: todaySchedule
            ? (todaySchedule.status === "scheduled" ? "#00e676" : "#ff1744")
            : "#888"
        }}>
          {todaySchedule
            ? (todaySchedule.status === "scheduled" ? "実施" : "中止")
            : "予定なし"}
        </div>

        {/* タイトル＋時間 */}
        <div style={{
          fontSize: "18px",
          marginTop: "10px",
          color: todaySchedule ? "#fff" : "#888",
          fontWeight: "bold"
        }}>
          {todaySchedule
            ? `${todaySchedule.title || "-"}（${todaySchedule.start_time || "-"}）`
            : "本日の予定はありません"}
        </div>

      </div>

      {/* =========================
        生徒一覧
      ========================= */}
      <div style={{
        marginTop: "20px",
        marginBottom: "10px",
        fontSize: "16px",
        fontWeight: "bold"
      }}>
        対象生徒
      </div>
      <div style={{ marginBottom: "20px" }}>
        {students.map(s => (
          <div 
            key={s.id} 
            onClick={() => navigate(`/parent/history/${s.id}`)}
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {s.name}
            <div style={{ marginTop: "8px", fontSize: "14px", color: "#ccc", fontWeight: "normal" }}>
              回数券：{ticketsLoaded ? `残り ${remainings[s.id] ?? 0}枚` : "取得中"}
            </div>
          </div>
        ))}
      </div>

      {/* =========================
        スケジュール
      ========================= */}
      <h2 style={{ marginTop: "30px" }}>スケジュール</h2>

      {/* 切替 */}
      <div style={{ display: "flex" }}>
        <button onClick={() => setViewMode("list")} style={{
          flex: 1,
          padding: "10px",
          background: viewMode === "list" ? "#ff6d00" : "#444",
          color: "#fff",
          border: "none"
        }}>一覧</button>

        <button onClick={() => setViewMode("calendar")} style={{
          flex: 1,
          padding: "10px",
          background: viewMode === "calendar" ? "#ff6d00" : "#444",
          color: "#fff",
          border: "none"
        }}>カレンダー</button>
      </div>

      {/* =========================
        一覧
      ========================= */}
      {viewMode === "list" &&
        schedules
          .filter(item => {
            if (!item.date) return false;
            return getJSTDate(item.date.toDate()) >= getJSTDate(new Date());
          })
          .sort((a, b) => a.date.toDate() - b.date.toDate())
          .slice(0, 10)
          .map(item => (
            <div key={item.id} style={{
              padding: "12px",
              margin: "10px 0",
              background: item.status === "cancelled" ? "#8b0000" : "#2e7d32",
              borderRadius: "10px"
            }}>
              {item.date.toDate().toLocaleDateString()}（{getWeekday(item.date.toDate())}）
              <br />
              {item.title}（{item.start_time}）
              <br />
              {item.status === "scheduled" ? "実施" : "中止"}
            </div>
          ))}

      {/* =========================
        カレンダー
      ========================= */}
      {viewMode === "calendar" && (() => {

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDay = new Date(year, month, 1).getDay();
        const days = generateCalendar(year, month);

        return (
          <div>

            {/* 月 */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => changeMonth(-1)}>◀</button>
              <div>{year}年{month + 1}月</div>
              <button onClick={() => changeMonth(1)}>▶</button>
            </div>

            {/* 曜日 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              marginTop: "10px"
            }}>
              {["日","月","火","水","木","金","土"].map(d => (
                <div key={d} style={{ textAlign: "center", color: "#aaa" }}>{d}</div>
              ))}
            </div>

            {/* 日付 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: "6px"
            }}>
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={i}></div>
              ))}

              {days.map(date => {

                const dateStr = getJSTDate(date);
                const todayStr = getJSTDate(new Date());
                const isToday = dateStr === todayStr;

                const schedule = schedules.find(s =>
                  s.date && getJSTDate(s.date.toDate()) === dateStr
                );

                return (
                  <div
                    key={date}
                    onClick={() => {
                      if (schedule) {
                        setSelectedSchedule(schedule);
                        setShowModal(true);
                      }
                    }}
                    style={{
                    padding: "10px",
                    textAlign: "center",
                    borderRadius: "8px",
                    border: isToday ? "2px solid #ff00ff" : "none",
                    background:
                      schedule
                        ? (schedule.status === "scheduled" ? "#69f0ae" : "#ff8a80")
                        : "#222"
                  }}>
                    {date.getDate()}

                    {/* モーダル */}
                  </div>
                );
              })}
            </div>

            {showModal && selectedSchedule && (
              <div
                onClick={() => setShowModal(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  zIndex: 1000
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "calc(100% - 24px)",
                    maxWidth: "420px",
                    background: "#1e1e1e",
                    borderRadius: "16px",
                    padding: "16px"
                  }}
                >

                  {/* タイトル */}
                  <div style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "10px",
                    color: "#fff"
                  }}>
                    スケジュール詳細
                  </div>

                  {/* 日付 */}
                  <div style={{ textAlign: "center", marginBottom: "8px", color: "#fff" }}>
                    {selectedSchedule.date.toDate().toLocaleDateString()}（{getWeekday(selectedSchedule.date.toDate())}）
                  </div>

                  {/* タイトル */}
                  <div style={{
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "#fff"
                  }}>
                    {selectedSchedule.title}
                  </div>

                  {/* 時間 */}
                  <div style={{ textAlign: "center", color: "#ccc" }}>
                    {selectedSchedule.start_time}
                  </div>

                  {/* 状態 */}
                  <div style={{
                    textAlign: "center",
                    marginTop: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: selectedSchedule.status === "scheduled" ? "#00e676" : "#ff1744"
                  }}>
                    {selectedSchedule.status === "scheduled" ? "実施" : "中止"}
                  </div>

                  {/* 閉じる */}
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      marginTop: "14px",
                      width: "100%",
                      padding: "10px",
                      background: "#444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px"
                    }}
                  >
                    閉じる
                  </button>

                </div>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}

export default Parent;
