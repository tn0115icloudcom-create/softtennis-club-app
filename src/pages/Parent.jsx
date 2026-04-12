import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
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

function Parent() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);

  //==============================
  // 生徒取得
  //==============================
  useEffect(() => {
    const fetchStudent = async () => {
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStudent(docSnap.data());
      }
    };

    fetchStudent();
  }, [id]);

  //==============================
  // 回数券取得
  //==============================
  useEffect(() => {
    const fetchTicket = async () => {
      const q = query(
        collection(db, "tickets"),
        where("student_id", "==", id)
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
  }, [id]);

  //==============================
  // 今日のスケジュール取得（JST対応）
  //==============================
  useEffect(() => {
    const fetchSchedule = async () => {
      const snapshot = await getDocs(collection(db, "schedules"));

      const schedules = snapshot.docs.map(doc => doc.data());

      const today = getJSTDate(new Date());

      const todayItem = schedules.find(item => {
        if (!item.date) return false;
        const itemDate = getJSTDate(item.date.toDate());
        return itemDate === today;
      });

      setTodaySchedule(todayItem || null);
    };

    fetchSchedule();
  }, []);

  //==============================
  // UI
  //==============================
  return (
    <div style={{ padding: "20px", background: "#121212", color: "#fff", minHeight: "100vh" }}>

      {/* 名前 */}
      <h1 style={{
        textAlign: "center",
        color: "#fff"
      }}>
        {student ? student.name : "読み込み中..."}
      </h1>

      {/* 回数券 */}
      <p style={{
        fontSize: "24px",
        textAlign: "center",
        margin: "20px 0",
        color: "#fff"
      }}>
        {remaining !== null
          ? `回数券：残り${remaining}枚`
          : "読み込み中..."}
      </p>

      {/* 日付 */}
      <div style={{
        textAlign: "center",
        fontSize: "18px",
        color: "#ccc"
      }}>
        {todaySchedule && todaySchedule.date.toDate().toLocaleDateString()}
      </div>

      {/* 状態 */}
      <div style={{
        marginTop: "10px",
        fontSize: "26px",
        fontWeight: "bold",
        textAlign: "center",
        color:
          todaySchedule
            ? (todaySchedule.status === "scheduled" ? "#00e676" : "#ff1744")
            : "#888"
      }}>
        本日の練習：
        {todaySchedule
          ? (todaySchedule.status === "scheduled" ? "実施" : "中止")
          : "なし"}
      </div>

    </div>
  );
}

export default Parent;