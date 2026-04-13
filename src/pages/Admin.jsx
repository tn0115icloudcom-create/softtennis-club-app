import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

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

  //==============================
  // 認証ガード用状態
  //==============================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("18:00");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newDate, setNewDate] = useState(getJSTDate(new Date()));
  const [title, setTitle] = useState("練習");
  const [time, setTime] = useState("19:00");
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  //==============================
  // 認証チェック（ログイン必須）
  //==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ログイン中
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // 未ログイン
        setIsLoading(false);
        navigate("/login", { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  //==============================
  // スケジュール取得（関数化）
  //==============================
  const fetchSchedules = async () => {
    const snapshot = await getDocs(collection(db, "schedules"));
    setSchedules(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  };

  useEffect(() => {
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const handleRegisterSchedule = async () => {
    if (!newDate || !title || !time) {
      alert("日付・タイトル・時間を入力してください");
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

    setShowModal(false);
    setNewDate(getJSTDate(new Date()));
    setTitle("練習");
    setTime("19:00");
    fetchSchedules();
    alert("スケジュールを登録しました");
  };

  const openScheduleEditor = (schedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!isMenuOpen) return;
      if (
        menuRef.current &&
        menuButtonRef.current &&
        !menuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  //==============================
  // 月変更処理
  //==============================
  const changeMonth = (diff) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + diff);
    setCurrentDate(newDate);
  };

  //==============================
  // スケジュール追加
  //==============================
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

  //==============================
  // スケジュール削除
  //==============================
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    await deleteDoc(doc(db, "schedules", scheduleId));
    fetchSchedules();
  };

  //==============================
  // ステータス変更（中止/再開）
  //==============================
  const handleToggleStatus = async (scheduleId, currentStatus) => {
    const newStatus = currentStatus === "scheduled" ? "cancelled" : "scheduled";
    await updateDoc(doc(db, "schedules", scheduleId), {
      status: newStatus
    });
    fetchSchedules();
  };

  //==============================
  // ローディング中の表示
  //==============================
  if (isLoading) {
    return (
      <div style={{
        padding: "20px",
        background: "#121212",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <p style={{ fontSize: "18px" }}>読み込み中...</p>
      </div>
    );
  }

  //==============================
  // 認証チェック：ログインしていない場合は何も表示しない
  //==============================
  if (!isAuthenticated) {
    return null;
  }

  //==============================
  // 一覧画面
  //==============================
  return (
      <div style={{
        padding: "20px",
        background: "#121212",
        minHeight: "100vh"
      }}>

        <div style={{
          background: "#1e1e1e",
          padding: "12px 16px",
          borderBottom: "1px solid #333",
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", position: "relative" }}>
          <h1 style={{
            color: "#fff",
            fontSize: "clamp(16px, 5vw, 25px)", // ←自動調整
            margin: 0
          }}>
            高橋キッズソフトテニスクラブ
          </h1>
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{
              width: "42px",
              height: "42px",
              background: "#444",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "20px",
              cursor: "pointer"
            }}
            aria-label="メニュー"
          >
            ≡
          </button>
          {isMenuOpen && (
            <div
              ref={menuRef}
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                background: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "10px",
                minWidth: "160px",
                boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                zIndex: 1000,
                padding: "8px"
              }}
            >
              <button
                onClick={() => {
                  navigate("/students");
                  setIsMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#121212",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  textAlign: "left",
                  marginBottom: "8px",
                  cursor: "pointer"
                }}
              >
                生徒一覧
              </button>
              <button
                onClick={() => {
                  setShowModal(true);
                  setIsMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#121212",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  textAlign: "left",
                  marginBottom: "8px",
                  cursor: "pointer"
                }}
              >
                スケジュール登録
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#121212",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: "400px",
              margin: "0 auto",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              color: "#fff",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ margin: 0, marginBottom: "14px", fontSize: "18px", textAlign: "center" }}>
              スケジュール登録
            </h2>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px" }}>
              日付
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "#121212",
                  color: "#fff",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px" }}>
              タイトル
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "#121212",
                  color: "#fff",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "16px", fontSize: "13px" }}>
              時間
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "#121212",
                  color: "#fff",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <button
              onClick={handleRegisterSchedule}
              style={{
                width: "100%",
                padding: "14px",
                background: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "8px"
              }}
            >
              登録
            </button>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#666",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
      {showEditModal && selectedSchedule && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: "400px",
              margin: "0 auto",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              color: "#fff"
            }}
          >
            <h2 style={{ margin: 0, marginBottom: "14px", fontSize: "18px", textAlign: "center" }}>
              スケジュール操作
            </h2>
            <div style={{ marginBottom: "12px", color: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>タイトル</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>{selectedSchedule.title || "練習"}</div>
            </div>
            <div style={{ marginBottom: "12px", color: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>時間</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>{selectedSchedule.start_time || "-"}</div>
            </div>
            <div style={{ marginBottom: "16px", color: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>ステータス</div>
              <div style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: selectedSchedule.status === "scheduled" ? "#0c8cf5" : "#ff1744"
              }}>
                {selectedSchedule.status === "scheduled" ? "実施" : "中止"}
              </div>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <button
                onClick={() => handleChangeScheduleStatus(selectedSchedule.id, selectedSchedule.status === "scheduled" ? "cancelled" : "scheduled")}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#0c8cf5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {selectedSchedule.status === "scheduled" ? "中止にする" : "実施にする"}
              </button>
              <button
                onClick={handleDeleteSelectedSchedule}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                削除
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer"
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
        <div style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #333",
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

          <div style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#fff",
            marginBottom: "10px"
          }}>
            {todaySchedule
              ? todaySchedule.date.toDate().toLocaleDateString() + "（" +
                ["日","月","火","水","木","金","土"][todaySchedule.date.toDate().getDay()] + "）"
              : "なし"
            }
          </div>

          <div style={{
            marginTop: "8px",
            fontSize: "28px",
            fontWeight: "bold",
            color: todaySchedule
              ? (todaySchedule.status === "scheduled" ? "#0c8cf5" : "#ff1744")
              : "#888",
            marginBottom: "14px"
          }}>
            {todaySchedule
              ? (todaySchedule.status === "scheduled" ? "実施" : "中止")
              : "なし"}
          </div>

          <div style={{
            fontSize: "18px",
            color: todaySchedule ? "#fff" : "#888",
            fontWeight: todaySchedule ? "600" : "400"
          }}>
            {todaySchedule
              ? `${todaySchedule.title || "-"}（${todaySchedule.start_time || "-"}）`
              : ""
            }
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
            <div style={{ overflowX: "hidden" }}>

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
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
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
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
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
                  const isSelected = selectedDate && getJSTDate(selectedDate) === dateStr;

                  const schedule = schedules.find(s => {
                    if (!s.date) return false;
                    return getJSTDate(s.date.toDate()) === dateStr;
                  });

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date);
                        if (schedule) {
                          openScheduleEditor(schedule);
                        }
                      }}
                      style={{
                        padding: "4px",
                        aspectRatio: "1 / 1",
                        borderRadius: "8px",
                        border: isSelected ? "3px solid #ffb300" : (isToday ? "3px solid #f305e7" : "none"),
                        textAlign: "center",
                        background:
                          schedule
                            ? (schedule.status === "scheduled" ? "#69f0ae" : "#ff8a80")
                            : "#222",
                        color: "#fff",
                        cursor: schedule ? "pointer" : "default",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: "bold" }}>{date.getDate()}</div>
                      {schedule && (
                        <>
                          <div style={{ fontSize: "9px", color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {schedule.title || "練習"}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: schedule.status === "scheduled" ? "#0c8cf5" : "#ff1744"
                          }}>
                            {schedule.status === "scheduled" ? "実施" : "中止"}
                          </div>
                        </>
                      )}
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
              background: item.status === "cancelled" ? "#8b0000" : "#2e7d32",
              border: "1px solid #333",
              borderRadius: "10px",
              color: "#fff",
              fontWeight: "bold"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div>
                {item.date.toDate().toLocaleDateString()}（{
                  ["日","月","火","水","木","金","土"][item.date.toDate().getDay()]
                }）
                <br />
                {item.title}（{item.start_time}）
                <br />
                ステータス：{item.status === "scheduled" ? "実施" : "中止"}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleToggleStatus(item.id, item.status)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: item.status === "scheduled" ? "#c62828" : "#2e7d32",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  {item.status === "scheduled" ? "中止" : "再開"}
                </button>
                <button
                  onClick={() => handleDeleteSchedule(item.id)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#d32f2f",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>
    );
}

export default App;