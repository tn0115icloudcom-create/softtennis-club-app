import { useParams, useNavigate } from "react-router-dom";

function StudentDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px", color: "#fff" }}>

      {/* ヘッダー */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1>生徒詳細</h1>

        <button
          onClick={() => navigate("/students")}
          style={{
            padding: "6px 12px",
            background: "#444",
            color: "#fff",
            border: "none",
            borderRadius: "6px"
          }}
        >
          戻る
        </button>
      </div>

      {/* 内容（仮） */}
      <p>ID: {id}</p>

    </div>
  );
}

export default StudentDetail;