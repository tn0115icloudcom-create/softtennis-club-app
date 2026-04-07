//データインポート設定-------^---------------------
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
//-------------------------------------------------

//アプリ構築---------------------------------------
function App() {
  //データ管理====================================
  const [students, setStudents] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [schedules, setSchedules] = useState([]);
  //==============================================

  //データ取得************************************
  // 生徒一覧取得
  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(data);
    };

    fetchStudents();
  }, []);

  // スケジュール取得
  useEffect(() => {
    const fetchSchedules = async () => {
      const querySnapshot = await getDocs(collection(db, "schedules"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(data);
    };

    fetchSchedules();
  }, []);

  //当日スケジュール取得
  useEffect(() => {
    if (!schedules.length) return;

    const today = new Date().toISOString().slice(0, 10);

    const todayItem = schedules.find(item => {
      if (!item.date) return false;

      const itemDate = item.date.toDate().toISOString().slice(0, 10);
      return itemDate === today;
    });

    setTodaySchedule(todayItem || null);
  }, [schedules]);

  // チケット取得（残回数計算）
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
        const remain = (data.total || 0) - (data.used || 0);
        setRemaining(remain);
      } else {
        setRemaining(0);
      }
    };

    fetchTicket();
  }, [selectedStudent]);
  //**********************************************

  //表示設定<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  // 一覧画面
  if (!selectedStudent) {
    return (
      //生徒一覧####################################
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>生徒一覧</h1>

        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          {students.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              style={{
                padding: "15px",
                margin: "10px 0",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                cursor: "pointer",
                fontSize: "18px"
              }}
            >
              {student.name}
            </div>
          ))}
        </div>

      <div style={{ fontSize: "14px", color: "#666" }}>
        {todaySchedule && todaySchedule.date.toDate().toLocaleDateString()}
      </div>

      <div
        style={{
          margin: "20px 0",
          fontSize: "22px",
          fontWeight: "bold",
          color:
            todaySchedule
              ? (todaySchedule.status === "scheduled" ? "green" : "red")
              : "gray"
        }}
      >
        本日の練習：
        {todaySchedule
          ? (todaySchedule.status === "scheduled" ? "開催" : "中止")
          : "なし"}
      </div>

        <h2 style={{ marginTop: "40px" }}>スケジュール</h2>

        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          {schedules.map(item => (
            <div
              key={item.id}
              style={{
                padding: "10px",
                margin: "10px 0",
                background: item.status === "cancelled" ? "#ffe5e5" : "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}
            >
              {item.title}（{item.start_time}）
              <br />
              状態：{item.status === "scheduled" ? "開催" : "中止"}
            </div>
          ))}
        </div>

      </div>
    );
  }
  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  //データ処理++++++++++++++++++++++++++++++++++++
  // 出席処理
  const handleAttend = async () => {
    if (todaySchedule && todaySchedule.status === "cancelled") {
      alert("本日は中止のため出席できません");
      return;
    }

    if (!window.confirm("出席登録しますか？")) return;

    // 残回数チェック
    if (remaining <= 0) {
      alert("残り回数がありません");
      return;
    }

    // attendance追加
    await addDoc(collection(db, "attendance"), {
      student_id: selectedStudent.id,
      date: new Date(),
      status: "present"
    });

    // tickets更新
    const q = query(
      collection(db, "tickets"),
      where("student_id", "==", selectedStudent.id)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const ticketDoc = snapshot.docs[0];
      const currentUsed = ticketDoc.data().used || 0;

      await updateDoc(doc(db, "tickets", ticketDoc.id), {
        used: currentUsed + 1
      });
    }

    // 画面更新
    setRemaining(prev => prev - 1);

    alert("出席登録しました");
  };
  //++++++++++++++++++++++++++++++++++++++++++++++

  //表示設定<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  // 詳細画面
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>{selectedStudent.name}</h1>

      <p style={{ fontSize: "20px", margin: "20px 0" }}>
        残り回数：{remaining}回
      </p>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleAttend}
          style={{
            padding: "15px",
            fontSize: "18px",
            background: "orange",
            color: "white",
            border: "none",
            borderRadius: "8px",
            width: "100%"
          }}
        >
          出席
        </button>
      </div>

      <div style={{ marginTop: "10px", textAlign: "right" }}>
        <button
          onClick={() => setSelectedStudent(null)}
          style={{
            padding: "8px 16px",
            fontSize: "14px"
          }}
        >
          戻る
        </button>
      </div>
    </div>
  );
  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}
//------------------------------------------------
export default App;