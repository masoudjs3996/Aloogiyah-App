"use client";
import { useEffect, useState } from "react";
// محتوای API به HTML خام تزریق نمی‌شود؛ محتوای قدیمی به متن قابل‌خواندن تبدیل می‌شود.
export default function SafeArticleContent({ content }: { content: string }) {
  const [text, setText] = useState(content);
  useEffect(() => {
    if (!/<[a-z][\s\S]*>/i.test(content)) {
      setText(content);
      return;
    }
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc
      .querySelectorAll("script,style,iframe,object,embed")
      .forEach((node) => node.remove());
    doc.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
    doc
      .querySelectorAll("p,h1,h2,h3,h4,li,div,section")
      .forEach((node) => node.append("\n\n"));
    setText(doc.body.textContent || "");
  }, [content]);
  return (
    <div className="whitespace-pre-wrap break-words text-base leading-9 text-slate-700">
      {text}
    </div>
  );
}
