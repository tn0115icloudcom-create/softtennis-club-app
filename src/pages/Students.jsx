import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Students() {

  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

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

  return (
  <div style={{ padding: "20px" }}>

    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <h1 style={{ color: "#fff" }}>生徒一覧</h1>

      <button
        onClick={() => navigate("/admin")}
        style={{
          padding: "8px 12px",
          background: "#444",
          color: "#fff",
          border: "none",
          borderRadius: "6px"
        }}
      >
        ホーム
      </button>
    </div>

      {students.map(s => (
        <div
          key={s.id}
          onClick={() => navigate(`/students/${s.id}`)}

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
  );
}

export default Students;