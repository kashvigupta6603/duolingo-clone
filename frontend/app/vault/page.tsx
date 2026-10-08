"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { VaultItem } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple choice",
  translate: "Translate",
  match_pairs: "Match pairs",
  fill_blank: "Fill in the blank",
  type_answer: "Type the answer",
};

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[] | null>(null);

  useEffect(() => {
    api<{ items: VaultItem[] }>("/api/vault").then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);

  if (!items) return <div className="center-msg">Loading…</div>;

  const due = items.filter((i) => i.due).length;
  const mastered = items.filter((i) => i.mastered).length;
  const learning = items.length - mastered;

  return (
    <div className="page">
      <h1 className="page-title">🧠 Mistakes Vault</h1>
      <p className="page-sub">
        Every wrong answer lands here. Get it right 3 times in a row (Box 1 → 2 → 3) and it is mastered.
      </p>

      <div className="stat-grid three">
        <div className="stat-tile"><div><div className="st-val">{due}</div><div className="st-label">Due now</div></div></div>
        <div className="stat-tile"><div><div className="st-val">{learning}</div><div className="st-label">Learning</div></div></div>
        <div className="stat-tile"><div><div className="st-val">{mastered}</div><div className="st-label">Mastered</div></div></div>
      </div>

      {due > 0 && <Link href="/practice" className="btn" style={{ margin: "20px 0" }}>Practice {Math.min(due, 8)} mistakes</Link>}

      {items.length === 0 ? (
        <div className="center-msg">
          <div style={{ fontSize: 72 }}>✨</div>
          Your vault is empty. Mistakes you make in lessons will show up here.
        </div>
      ) : (
        <div className="vault-list">
          {items.map((i) => (
            <div key={i.id} className={`vault-item ${i.mastered ? "mastered" : ""}`}>
              <div style={{ flex: 1 }}>
                <div className="vi-type">{TYPE_LABEL[i.type]}</div>
                <div className="vi-preview">{i.preview}</div>
                <div className="vi-meta">Wrong {i.times_wrong}×</div>
              </div>
              {i.mastered ? (
                <span className="badge-ok">Mastered ✓</span>
              ) : (
                <div className="boxes" title={`Box ${i.box} of 3`}>
                  {[1, 2, 3].map((b) => (
                    <span key={b} className={b <= i.box ? "bx on" : "bx"} />
                  ))}
                  {i.due && <span className="due-tag">DUE</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}