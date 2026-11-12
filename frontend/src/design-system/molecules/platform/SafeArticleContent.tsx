"use client";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import './article-content.css';
export default function SafeArticleContent({ content, className = "" }: { content: string; className?: string }) {
 const [html, setHtml] = useState('');
 const rich = /<[a-z][\s\S]*>|&(?:#\d+|#x[\da-f]+|[a-z]+);/i.test(content);
 useEffect(() => {
  const body = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['p','br','div','span','h1','h2','h3','h4','strong','b','em','i','u','s','blockquote','ol','ul','li','a','img'],
  ALLOWED_ATTR: ['href','src','alt','title','class','dir','style'], ALLOW_DATA_ATTR: false,
  RETURN_DOM: true,
 }) as HTMLElement;
 // Preserve only editor colors, never arbitrary layout or external CSS resources.
 body.querySelectorAll<HTMLElement>('[style]').forEach(node => {
  const colors = ['color', 'background-color'].map(property => [property, node.style.getPropertyValue(property)]);
  node.removeAttribute('style');
  colors.forEach(([property, value]) => {
   if (/^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%/]+\)|[a-z]+)$/i.test(value)) node.style.setProperty(property, value);
  });
 });
 setHtml(body.innerHTML);
 }, [content]);
 if (!rich) return <div className={`whitespace-pre-wrap break-words text-base leading-9 text-slate-700 ${className}`}>{content}</div>;
 return <div dir="rtl" className={`article-content break-words text-base leading-9 text-slate-700 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
