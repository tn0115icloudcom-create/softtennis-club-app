import { useState, useEffect, useRef } from "react";

/**
 * 共通ヘッダーメニューコンポーネント
 * ・見た目と挙動のみ提供
 * ・メニューの中身は children で外から渡す
 */
function HeaderMenu({ children }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // 外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      {/* メニューボタン */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          color: "#fff",
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          fontSize: "18px",
          cursor: "pointer"
        }}
      >
        ☰
      </button>

      {/* メニュー本体 */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "0",
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: "12px",
            width: "180px",
            overflow: "hidden",
            zIndex: 1000
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default HeaderMenu;