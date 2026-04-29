import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
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

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#ffffff",
  color: "#222222",
  fontSize: "16px",
  boxSizing: "border-box"
};

const dateInputStyle = {
  ...inputStyle,
  width: "calc(100% - 24px)",
  maxWidth: "calc(100% - 24px)"
};

const timeInputStyle = {
  ...inputStyle,
  width: "calc(100% - 24px)",
  maxWidth: "calc(100% - 24px)"
};

const shadowStyle = "0 10px 24px rgba(15, 23, 42, 0.08)";

function Admin() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newDate, setNewDate] = useState(getJSTDate(new Date()));
  const [title, setTitle] = useState("練習");
  const [time, setTime] = useState("19:00");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        navigate("/login", { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchSchedules = async () => {
    const snapshot = await getDocs(collection(db, "schedules"));
    setSchedules(
      snapshot.docs.map((scheduleDoc) => ({
        id: scheduleDoc.id,
        ...scheduleDoc.data()
      }))
    );
  };

  useEffect(() => {
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const handleRegisterSchedule = async () => {
    if (!newDate || !title || !time) {
      alert("日付・タイトル・開始時間を入力してください");
      return;
    }

    const date = new Date(newDate);
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);

    await addDoc(collection(db, "schedules"), {
      date,
      title,
      start_time: time,
      status: "scheduled"
    });

    setShowScheduleModal(false);
    setNewDate(getJSTDate(new Date()));
    setTitle("練習");
    setTime("19:00");
    fetchSchedules();
    alert("スケジュールを登録しました");
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: "20px",
          background: theme.background,
          color: theme.text,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <p style={{ fontSize: "18px" }}>読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        padding: "20px",
        background: theme.background,
        minHeight: "100vh",
        color: theme.text
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>管理ホーム</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: theme.subText }}>
            生徒と予定をまとめて管理できます
          </div>
        </div>
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

      <div
        style={{
          background: theme.card,
          padding: "20px",
          borderRadius: "16px",
          boxShadow: shadowStyle,
          marginBottom: "20px"
        }}
      >
        <div style={{ fontSize: "14px", color: theme.subText, marginBottom: "10px" }}>今日の活動</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: theme.text, marginBottom: "10px" }}>
          {new Date().toLocaleDateString()}（{getWeekday(new Date())}）
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "28px",
            fontWeight: "bold",
            color: todaySchedule
              ? todaySchedule.status === "scheduled"
                ? theme.primary
                : theme.danger
              : theme.subText,
            marginBottom: "14px"
          }}
        >
          {todaySchedule ? (todaySchedule.status === "scheduled" ? "実施" : "中止") : "予定なし"}
        </div>
        <div
          style={{
            fontSize: "18px",
            color: todaySchedule ? theme.text : theme.subText,
            fontWeight: todaySchedule ? "600" : "400"
          }}
        >
          {todaySchedule
            ? `${todaySchedule.title || "-"}（${todaySchedule.start_time || "-"}）`
            : "本日の予定はありません"}
        </div>
      </div>

      <div
        style={{
          background: theme.card,
          borderRadius: "16px",
          padding: "20px",
          boxShadow: shadowStyle,
          marginBottom: "20px"
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "14px" }}>クイックメニュー</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "12px"
          }}
        >
          <button
            onClick={() => navigate("/news")}
            style={{
              padding: "18px 14px",
              border: "none",
              borderRadius: "16px",
              background: theme.primary,
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: shadowStyle
            }}
          >
            📢 お知らせ
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              padding: "18px 14px",
              border: "none",
              borderRadius: "16px",
              background: theme.primary,
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: shadowStyle
            }}
          >
            ➕ スケジュール登録
          </button>
          <button
            onClick={() => navigate("/students", { state: { openAddStudent: true } })}
            style={{
              padding: "18px 14px",
              border: "none",
              borderRadius: "16px",
              background: theme.primary,
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: shadowStyle
            }}
          >
            👤 生徒追加
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            background: theme.card,
            borderRadius: "16px",
            padding: "20px",
            boxShadow: shadowStyle
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>生徒管理</div>
          <div style={{ fontSize: "16px", color: theme.subText, marginBottom: "16px" }}>
            生徒情報・参加履歴を管理
          </div>
          <button
            onClick={() => navigate("/students")}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid " + theme.border,
              background: theme.background,
              color: theme.text,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            生徒一覧へ
          </button>
        </div>

        <div
          style={{
            background: theme.card,
            borderRadius: "16px",
            padding: "20px",
            boxShadow: shadowStyle
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>スケジュール管理</div>
          <div style={{ fontSize: "16px", color: theme.subText, marginBottom: "16px" }}>
            予定の登録・編集
          </div>
          <button
            onClick={() => navigate("/admin/schedule")}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid " + theme.border,
              background: theme.background,
              color: theme.text,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            スケジュール管理へ
          </button>
        </div>
      </div>

      {showScheduleModal && (
        <div
          onClick={() => setShowScheduleModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1100
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 40px)",
              maxWidth: "420px",
              background: theme.card,
              borderRadius: "16px",
              padding: "20px 16px",
              boxSizing: "border-box",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              zIndex: 1000,
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ margin: 0, marginBottom: "12px", fontSize: "16px", textAlign: "center", color: theme.text }}>
              スケジュール登録
            </h2>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "13px" }}>
              日付
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ ...dateInputStyle, marginTop: "4px" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "13px" }}>
              開始時間
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ ...timeInputStyle, marginTop: "4px" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "13px" }}>
              タイトル
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ ...inputStyle, marginTop: "4px" }}
              />
            </label>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={handleRegisterSchedule}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: theme.success,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                登録
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: theme.subText,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px"
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

export default Admin;
