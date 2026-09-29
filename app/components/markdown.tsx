import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

// Answers mention generics like List<String>; without escaping, markdown treats them as
// HTML tags and drops them. Code spans and fences are left untouched.
function escapeAngleBrackets(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/</g, "&lt;")))
    .join("");
}

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
      >
        {escapeAngleBrackets(children)}
      </ReactMarkdown>
    </div>
  );
}
