import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { theme } from "../styles/theme";

const getJSTDate = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

const getWeekday = (date) => {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
};

const sectionTitleStyle = {
  margin: "0 0 12px",
  fontSize: "16px",
  fontWeight: "bold",
  color: theme.text
};

const shadowStyle = "0 10px 24px rgba(15, 23, 42, 0.08)";

function Parent() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({});
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [remainings, setRemainings] = useState({});
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

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

      const snapshot = await getDocs(collection(db, "students"));

      const list = snapshot.docs
        .map((studentDoc) => ({
          id: studentDoc.id,
          ...studentDoc.data()
        }))
        .filter((student) => studentIds.includes(student.id));

      setStudents(list);
    });

    return () => unsubscribe();
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
    const fetchTicketRemainings = async () => {
      const snapshot = await getDocs(collection(db, "tickets"));
      const map = {};

      snapshot.docs.forEach((ticketDoc) => {
        const data = ticketDoc.data();
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

  useEffect(() => {
    if (!schedules.length) return;

    const today = getJSTDate(new Date());

    const todayItem = schedules.find((item) => {
      if (!item.date) return false;
      return getJSTDate(item.date.toDate()) === today;
    });

    setTodaySchedule(todayItem || null);
  }, [schedules]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const shortcuts = [
    { icon: "📢", label: "お知らせ", path: "/news" },
    { icon: "📅", label: "スケジュール", path: "/schedule" },
    { icon: "👤", label: "マイページ", path: "/mypage" }
  ];

  return (
    <div
      style={{
        padding: "20px",
        background: theme.background,
        minHeight: "100vh",
        color: theme.text,
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "12px"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold", color: theme.text }}>
          ホーム
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid " + theme.border,
            background: theme.card,
            color: theme.text,
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          ログアウト
        </button>
      </div>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={sectionTitleStyle}>今日の活動</h2>
        <div
          style={{
            background: theme.card,
            borderRadius: "16px",
            padding: "20px",
            boxShadow: shadowStyle
          }}
        >
          <div style={{ fontSize: "18px", color: theme.subText }}>
            {new Date().toLocaleDateString()}（{getWeekday(new Date())}）
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              marginTop: "10px",
              color: todaySchedule
                ? todaySchedule.status === "scheduled"
                  ? theme.success
                  : theme.danger
                : theme.subText
            }}
          >
            {todaySchedule ? (todaySchedule.status === "scheduled" ? "実施" : "中止") : "予定なし"}
          </div>

          <div
            style={{
              fontSize: "18px",
              marginTop: "10px",
              color: todaySchedule ? theme.text : theme.subText,
              fontWeight: "bold"
            }}
          >
            {todaySchedule
              ? `${todaySchedule.title || "-"}  ${todaySchedule.start_time || "-"}`
              : "本日の活動予定はありません"}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={sectionTitleStyle}>生徒</h2>
        <div style={{ display: "grid", gap: "16px" }}>
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => navigate(`/parent/history/${student.id}`)}
              style={{
                width: "100%",
                padding: "20px",
                border: "none",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #1e88e5 0%, #42a5f5 55%, #64b5f6 100%)",
                color: "#ffffff",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 14px 28px rgba(30, 136, 229, 0.24)"
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.86 }}>{student.kana || "ふりがな未設定"}</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "6px" }}>{student.name}</div>
              <div style={{ fontSize: "16px", marginTop: "14px" }}>
                {student.grade ? `${student.grade}年生` : "学年未設定"}
              </div>
              <div style={{ fontSize: "16px", marginTop: "8px" }}>
                回数券残数: {ticketsLoaded ? `${remainings[student.id] ?? 0}回` : "読み込み中"}
              </div>
            </button>
          ))}

          {students.length === 0 && (
            <div
              style={{
                background: theme.card,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: shadowStyle,
                color: theme.subText
              }}
            >
              登録されている生徒がいません
            </div>
          )}
        </div>
      </section>

      <section>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "12px"
          }}
        >
          {shortcuts.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: "18px 12px",
                borderRadius: "14px",
                border: "none",
                background: theme.card,
                color: theme.text,
                boxShadow: shadowStyle,
                cursor: "pointer"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>{item.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>{item.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Parent;
