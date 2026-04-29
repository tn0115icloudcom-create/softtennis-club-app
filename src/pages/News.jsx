import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { theme } from "../styles/theme";

const shadowStyle = "0 10px 24px rgba(15, 23, 42, 0.08)";

const typeConfig = {
  normal: { label: "通常", color: theme.primary },
  important: { label: "重要", color: theme.danger },
  cancel: { label: "中止・変更", color: theme.danger }
};

const getPublishedTime = (publishedAt) => {
  if (!publishedAt || typeof publishedAt.toDate !== "function") {
    return 0;
  }

  return publishedAt.toDate().getTime();
};

const formatPublishedAt = (publishedAt) => {
  if (!publishedAt || typeof publishedAt.toDate !== "function") {
    return "-";
  }

  return publishedAt.toDate().toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function News() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const noticesQuery = query(
          collection(db, "notices"),
          where("is_published", "==", true)
        );

        const snapshot = await getDocs(noticesQuery);
        const fetchedNotices = snapshot.docs.map((noticeDoc) => ({
          id: noticeDoc.id,
          ...noticeDoc.data()
        }));

        fetchedNotices.sort(
          (a, b) => getPublishedTime(b.published_at) - getPublishedTime(a.published_at)
        );
        setNotices(fetchedNotices);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: theme.background,
        color: theme.text,
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>お知らせ</h1>
          <div style={{ marginTop: "6px", fontSize: "14px", color: theme.subText }}>
            クラブからのお知らせを確認できます
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
            boxShadow: shadowStyle,
            flexShrink: 0
          }}
        >
          戻る
        </button>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {loading && (
          <div
            style={{
              background: theme.card,
              borderRadius: "16px",
              padding: "24px",
              boxShadow: shadowStyle,
              color: theme.subText
            }}
          >
            読み込み中...
          </div>
        )}

        {!loading && notices.length === 0 && (
          <div
            style={{
              background: theme.card,
              borderRadius: "16px",
              padding: "24px",
              boxShadow: shadowStyle,
              color: theme.subText
            }}
          >
            お知らせはありません
          </div>
        )}

        {!loading &&
          notices.map((notice) => {
            const config = typeConfig[notice.type] || typeConfig.normal;

            return (
              <article
                key={notice.id}
                style={{
                  background: theme.card,
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: shadowStyle,
                  textAlign: "left"
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: config.color,
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "14px"
                  }}
                >
                  {config.label}
                </div>

                <div
                  style={{
                    border: "1px solid " + theme.border,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                    background: "#ffffff"
                  }}
                >
                  <div style={{ fontSize: "13px", color: theme.subText, marginBottom: "6px" }}>
                    タイトル
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                    {notice.title || "無題"}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid " + theme.border,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    background: "#ffffff"
                  }}
                >
                  <div style={{ fontSize: "13px", color: theme.subText, marginBottom: "6px" }}>
                    本文
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.7,
                      color: theme.text,
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {notice.body || ""}
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: theme.subText }}>
                  投稿日時: {formatPublishedAt(notice.published_at)}
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

export default News;
