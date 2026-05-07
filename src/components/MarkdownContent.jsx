import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold text-slate-900 mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold text-slate-800 mt-4 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-slate-700 leading-relaxed mb-4 last:mb-0">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-slate-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-4 space-y-1 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-slate-300 pl-4 my-4 text-slate-600 italic bg-slate-50 py-2 pr-3 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children }) => {
    const language = /language-(\w+)/.exec(className || '')?.[1];
    if (!inline && language) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem', margin: '1rem 0' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
    if (!inline && !language) {
      // Fenced block without a language tag
      return (
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 overflow-x-auto text-xs font-mono leading-relaxed">
          <code>{children}</code>
        </pre>
      );
    }
    // Inline code
    return (
      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 text-slate-700 font-semibold">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-200">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-slate-50">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-slate-200 text-slate-700">{children}</td>
  ),
  hr: () => <hr className="my-6 border-slate-200" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="max-w-full rounded-lg my-4 shadow-sm" />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
};

export default function MarkdownContent({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`markdown-content text-sm min-w-0 break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
