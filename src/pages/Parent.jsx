import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

function Parent() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);

  // 生徒取得
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

  // チケット取得
  useEffect(() => {
    const fetchTicket = async () => {
      const q = query(
        collection(db, "tickets"),
        where("student_id", "==", id)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const remain = (data.total || 0) - (data.used || 0);
        setRemaining(remain);
      }
    };

    fetchTicket();
  }, [id]);

  // 今日のスケジュール
  useEffect(() => {
    const fetchSchedule = async () => {
      const querySnapshot = await getDocs(collection(db, "schedules"));

      const schedules = querySnapshot.docs.map(doc => doc.data());

      const today = new Date().toISOString().slice(0, 10);

      const todayItem = schedules.find(item => {
        if (!item.date) return false;

        const itemDate = item.date.toDate().toISOString().slice(0, 10);
        return itemDate === today;
      });

      setTodaySchedule(todayItem || null);
    };

    fetchSchedule();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>{student ? student.name : "読み込み中..."}</h1>

      <p style={{ fontSize: "20px" }}>
        残り回数：{remaining !== null ? `${remaining}回` : "読み込み中..."}
      </p>

      <div
        style={{
          marginTop: "20px",
          fontSize: "20px",
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
    </div>
  );
}

export default Parent;