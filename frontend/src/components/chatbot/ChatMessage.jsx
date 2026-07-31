import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, User } from 'lucide-react';

export default function ChatMessage({ role, content, timestamp, isStreaming, files }) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 items-start animate-fadeIn ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Badge */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-300 hover:scale-110 ${
        isUser 
          ? 'bg-slate-900 text-white' 
          : 'bg-gradient-to-tr from-[#5F4BF2] to-[#7C3AED] text-white ring-2 ring-[#5F4BF2]/20'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[78%] rounded-[1.2rem] px-4 py-3 shadow-sm transition-all duration-300 ${
        isUser 
          ? 'bg-gradient-to-br from-[#5F4BF2] to-[#7C3AED] text-white rounded-tr-none shadow-[0_4px_15px_rgba(95,75,242,0.2)]' 
          : 'bg-card/90 backdrop-blur-md text-foreground border border-border/80 rounded-tl-none shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
      }`}>
        {isUser ? (
          <div className="flex flex-col gap-1.5">
            {files && files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-0.5">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center bg-black/15 px-2 py-1 rounded-md text-[11px] font-medium border border-white/20" title={file.name}>
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[13.5px] leading-relaxed font-medium whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-[13.5px] leading-relaxed text-foreground/90 
            prose-p:my-1 prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary hover:prose-a:underline
            prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-li:my-0.5
            prose-strong:font-bold prose-strong:text-foreground prose-code:bg-muted/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ' '}</ReactMarkdown>
            {isStreaming && <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" aria-hidden="true" />}
          </div>
        )}

        {timestamp && (
          <time className={`mt-1.5 block text-[10px] text-right font-medium tracking-wide ${
            isUser ? 'text-white/60' : 'text-muted-foreground/60'
          }`}>
            {new Date(timestamp).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        )}
      </div>
    </div>
  );
}
