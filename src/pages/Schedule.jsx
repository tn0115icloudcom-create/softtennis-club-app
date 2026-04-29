import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

const shadowStyle = "0 10px 24px rgba(15, 23, 42, 0.08)";

function Schedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const changeMonth = (diff) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + diff);
    setCurrentDate(nextDate);
  };

  const openScheduleModal = (schedule) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
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
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>スケジュール</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: theme.subText }}>
            今日と今後の予定を確認できます
          </div>
        </div>

        <button
          onClick={() => navigate("/parent")}
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
          gap: "10px",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setViewMode("list")}
          style={{
            padding: "14px",
            border: "none",
            borderRadius: "14px",
            background: viewMode === "list" ? theme.primary : theme.card,
            color: viewMode === "list" ? "#ffffff" : theme.text,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          一覧
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            padding: "14px",
            border: "none",
            borderRadius: "14px",
            background: viewMode === "calendar" ? theme.primary : theme.card,
            color: viewMode === "calendar" ? "#ffffff" : theme.text,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: shadowStyle
          }}
        >
          カレンダー
        </button>
      </div>

      {viewMode === "list" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {upcomingSchedules.map((item) => {
            const dateStr = getJSTDate(item.date.toDate());
            const isToday = dateStr === getJSTDate(new Date());

            return (
              <button
                key={item.id}
                onClick={() => openScheduleModal(item)}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "16px",
                  padding: "18px",
                  textAlign: "left",
                  background: theme.card,
                  color: theme.text,
                  cursor: "pointer",
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
              </button>
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
              const schedule = schedules.find((item) => {
                if (!item.date) return false;
                return getJSTDate(item.date.toDate()) === dateStr;
              });

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    if (schedule) openScheduleModal(schedule);
                  }}
                  style={{
                    minHeight: "72px",
                    padding: "8px 4px",
                    border: isToday ? "2px solid " + theme.primary : "1px solid " + theme.border,
                    borderRadius: "12px",
                    background: schedule
                      ? schedule.status === "scheduled"
                        ? "#e8f5e9"
                        : "#ffebee"
                      : theme.background,
                    color: theme.text,
                    cursor: schedule ? "pointer" : "default"
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
        </div>
      )}

      {showModal && selectedSchedule && (
        <div
          onClick={() => setShowModal(false)}
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
              {selectedSchedule.date.toDate().toLocaleDateString()}（
              {getWeekday(selectedSchedule.date.toDate())}）
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
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                marginTop: "18px",
                padding: "12px",
                border: "none",
                borderRadius: "12px",
                background: theme.primary,
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
