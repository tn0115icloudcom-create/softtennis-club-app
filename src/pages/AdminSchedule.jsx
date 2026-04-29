import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
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

const generateCalendar = (year, month) => {
  const days = [];
  const total = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= total; i += 1) {
    days.push(new Date(year, month, i));
  }

  return days;
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

function AdminSchedule() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("18:00");
  const [newDate, setNewDate] = useState(getJSTDate(new Date()));
  const [title, setTitle] = useState("練習");
  const [time, setTime] = useState("19:00");

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

  const changeMonth = (diff) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + diff);
    setCurrentDate(nextDate);
  };

  const openScheduleEditor = (schedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
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

    setShowRegisterModal(false);
    setNewDate(getJSTDate(new Date()));
    setTitle("練習");
    setTime("19:00");
    fetchSchedules();
    alert("スケジュールを登録しました");
  };

  const handleAddSchedule = async () => {
    if (!newScheduleTitle || !selectedDate || !newScheduleTime) {
      alert("タイトル・日付・開始時間を入力してください");
      return;
    }

    const date = new Date(selectedDate);
    const [hours, minutes] = newScheduleTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);

    await addDoc(collection(db, "schedules"), {
      title: newScheduleTitle,
      date,
      start_time: newScheduleTime,
      status: "scheduled"
    });

    setNewScheduleTitle("");
    setSelectedDate(null);
    setNewScheduleTime("18:00");
    fetchSchedules();
    alert("スケジュールを追加しました");
  };

  const handleChangeScheduleStatus = async (scheduleId, status) => {
    await updateDoc(doc(db, "schedules", scheduleId), {
      status
    });
    fetchSchedules();
    setShowEditModal(false);
    setSelectedSchedule(null);
  };

  const handleDeleteSelectedSchedule = async () => {
    if (!selectedSchedule) return;
    if (!window.confirm("このスケジュールを削除しますか？")) return;

    await deleteDoc(doc(db, "schedules", selectedSchedule.id));
    fetchSchedules();
    setShowEditModal(false);
    setSelectedSchedule(null);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    await deleteDoc(doc(db, "schedules", scheduleId));
    fetchSchedules();
  };

  const handleToggleStatus = async (scheduleId, currentStatus) => {
    const newStatus = currentStatus === "scheduled" ? "cancelled" : "scheduled";
    await updateDoc(doc(db, "schedules", scheduleId), {
      status: newStatus
    });
    fetchSchedules();
  };

  const upcomingSchedules = schedules
    .filter((item) => {
      if (!item.date) return false;
      return getJSTDate(item.date.toDate()) >= getJSTDate(new Date());
    })
    .sort((a, b) => a.date.toDate() - b.date.toDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const days = generateCalendar(year, month);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        padding: "20px",
        boxSizing: "border-box"
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
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>スケジュール管理</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: theme.subText }}>
            予定の登録・編集・中止管理ができます
          </div>
        </div>

        <button
          onClick={() => navigate("/admin")}
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
          ホーム
        </button>
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
        <div style={{ fontSize: "14px", color: theme.subText }}>今日の活動</div>
        <div style={{ marginTop: "8px", fontSize: "18px", color: theme.subText }}>
          {new Date().toLocaleDateString()}（{getWeekday(new Date())}）
        </div>
        <div
          style={{
            marginTop: "12px",
            fontSize: "28px",
            fontWeight: "bold",
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
            marginTop: "10px",
            fontSize: "18px",
            fontWeight: "bold",
            color: todaySchedule ? theme.text : theme.subText
          }}
        >
          {todaySchedule
            ? `${todaySchedule.title || "-"}  ${todaySchedule.start_time || "-"}`
            : "本日の活動予定はありません"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setShowRegisterModal(true)}
          style={{
            padding: "16px",
            border: "none",
            borderRadius: "14px",
            background: theme.primary,
            color: "#fff",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          ＋ 新規登録
        </button>
        <button
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          style={{
            padding: "16px",
            border: "none",
            borderRadius: "14px",
            background: theme.card,
            color: theme.text,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          {viewMode === "list" ? "カレンダー表示" : "一覧表示"}
        </button>
      </div>

      <div
        style={{
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "bold",
          color: theme.text
        }}
      >
        {viewMode === "list" ? "一覧" : "カレンダー"}
      </div>

      {viewMode === "list" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {upcomingSchedules.map((item) => {
            const dateStr = getJSTDate(item.date.toDate());
            const isToday = dateStr === getJSTDate(new Date());

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: "16px",
                  padding: "18px",
                  background: theme.card,
                  color: theme.text,
                  boxShadow: shadowStyle
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", color: theme.subText }}>
                      {item.date.toDate().toLocaleDateString()}（{getWeekday(item.date.toDate())}）
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "18px", fontWeight: "bold" }}>{item.title}</div>
                    <div style={{ marginTop: "8px", fontSize: "16px", color: theme.subText }}>
                      {item.start_time}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                    {isToday && (
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#e3f2fd",
                          color: theme.primary,
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        今日
                      </span>
                    )}
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: item.status === "scheduled" ? "#e8f5e9" : "#ffebee",
                        color: item.status === "scheduled" ? theme.success : theme.danger,
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {item.status === "scheduled" ? "実施" : "中止"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                  <button
                    onClick={() => openScheduleEditor(item)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid " + theme.border,
                      background: theme.background,
                      color: theme.text,
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item.id, item.status)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: item.status === "scheduled" ? theme.danger : theme.success,
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    {item.status === "scheduled" ? "中止" : "再開"}
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#d32f2f",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}

          {upcomingSchedules.length === 0 && (
            <div
              style={{
                background: theme.card,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: shadowStyle,
                color: theme.subText
              }}
            >
              表示できるスケジュールはありません
            </div>
          )}
        </div>
      )}

      {viewMode === "calendar" && (
        <div
          style={{
            background: theme.card,
            borderRadius: "16px",
            padding: "18px",
            boxShadow: shadowStyle
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            <button
              onClick={() => changeMonth(-1)}
              style={{
                width: "42px",
                height: "42px",
                border: "none",
                borderRadius: "12px",
                background: theme.background,
                color: theme.text,
                fontSize: "18px",
                cursor: "pointer"
              }}
            >
              ‹
            </button>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                {year}年{month + 1}月
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                style={{
                  marginTop: "6px",
                  padding: "6px 10px",
                  border: "none",
                  borderRadius: "999px",
                  background: "#e3f2fd",
                  color: theme.primary,
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                今月へ戻る
              </button>
            </div>

            <button
              onClick={() => changeMonth(1)}
              style={{
                width: "42px",
                height: "42px",
                border: "none",
                borderRadius: "12px",
                background: theme.background,
                color: theme.text,
                fontSize: "18px",
                cursor: "pointer"
              }}
            >
              ›
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: "6px",
              marginBottom: "8px"
            }}
          >
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: theme.subText,
                  padding: "6px 0"
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: "6px"
            }}
          >
            {Array.from({ length: startDay }).map((_, index) => (
              <div key={`blank-${index}`} />
            ))}

            {days.map((date) => {
              const dateStr = getJSTDate(date);
              const todayStr = getJSTDate(new Date());
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate && getJSTDate(selectedDate) === dateStr;
              const schedule = schedules.find((item) => {
                if (!item.date) return false;
                return getJSTDate(item.date.toDate()) === dateStr;
              });

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    if (schedule) openScheduleEditor(schedule);
                  }}
                  style={{
                    minHeight: "72px",
                    padding: "8px 4px",
                    border: isSelected
                      ? "3px solid #ffb300"
                      : isToday
                        ? "2px solid " + theme.primary
                        : "1px solid " + theme.border,
                    borderRadius: "12px",
                    background: schedule
                      ? schedule.status === "scheduled"
                        ? "#e8f5e9"
                        : "#ffebee"
                      : theme.background,
                    color: theme.text,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>{date.getDate()}</div>
                  {schedule && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: schedule.status === "scheduled" ? theme.success : theme.danger
                      }}
                    >
                      {schedule.status === "scheduled" ? "実施" : "中止"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
            <input
              type="text"
              value={newScheduleTitle}
              onChange={(e) => setNewScheduleTitle(e.target.value)}
              placeholder="選択した日に追加するタイトル"
              style={inputStyle}
            />
            <input
              type="time"
              value={newScheduleTime}
              onChange={(e) => setNewScheduleTime(e.target.value)}
              style={timeInputStyle}
            />
            <button
              onClick={handleAddSchedule}
              style={{
                padding: "12px",
                border: "none",
                borderRadius: "12px",
                background: theme.primary,
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              選択日に追加
            </button>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div
          onClick={() => setShowRegisterModal(false)}
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
                onClick={() => setShowRegisterModal(false)}
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

      {showEditModal && selectedSchedule && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: theme.card,
              borderRadius: "16px",
              padding: "20px",
              boxSizing: "border-box",
              boxShadow: shadowStyle
            }}
          >
            <div style={{ fontSize: "14px", color: theme.subText, textAlign: "center" }}>
              {selectedSchedule.date.toDate().toLocaleDateString()}（{getWeekday(selectedSchedule.date.toDate())}）
            </div>
            <div
              style={{
                marginTop: "10px",
                fontSize: "20px",
                fontWeight: "bold",
                color: theme.text,
                textAlign: "center"
              }}
            >
              {selectedSchedule.title}
            </div>
            <div style={{ marginTop: "8px", fontSize: "16px", color: theme.subText, textAlign: "center" }}>
              {selectedSchedule.start_time}
            </div>
            <div
              style={{
                marginTop: "14px",
                fontSize: "18px",
                fontWeight: "bold",
                color: selectedSchedule.status === "scheduled" ? theme.success : theme.danger,
                textAlign: "center"
              }}
            >
              {selectedSchedule.status === "scheduled" ? "実施" : "中止"}
            </div>
            <div style={{ display: "grid", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={() =>
                  handleChangeScheduleStatus(
                    selectedSchedule.id,
                    selectedSchedule.status === "scheduled" ? "cancelled" : "scheduled"
                  )
                }
                style={{
                  padding: "12px",
                  border: "none",
                  borderRadius: "12px",
                  background: selectedSchedule.status === "scheduled" ? theme.danger : theme.success,
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {selectedSchedule.status === "scheduled" ? "中止にする" : "実施に戻す"}
              </button>
              <button
                onClick={handleDeleteSelectedSchedule}
                style={{
                  padding: "12px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#d32f2f",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                削除
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: "12px",
                  border: "none",
                  borderRadius: "12px",
                  background: theme.primary,
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSchedule;
