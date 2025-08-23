import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, User, Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isUser 
              ? 'bg-slate-700' 
              : isError
                ? 'bg-red-600'
                : 'bg-white/10 border border-white/10'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white/80" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex flex-col min-w-0">
          {/* Message Bubble */}
          <div className={`
            rounded-2xl px-4 py-3 backdrop-blur-sm
            ${isUser 
              ? 'bg-slate-700/20 border border-slate-600/30' 
              : isError
                ? 'bg-red-600/15 border border-red-500/30'
                : 'bg-card/60 border border-white/10'
            }
          `}>
            {isUser ? (
              <p className="text-white/92 leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  className="text-white/92 leading-relaxed"
                  components={{
                    code: ({ inline, className, children, ...props }) => {
                      return inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto">
                          <code className="text-white/90 text-sm font-mono">{children}</code>
                        </pre>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-white">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-slate-600/50 pl-3 my-2 text-white/80">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Message Metadata */}
          <div className={`
            flex items-center justify-between mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity
            ${isUser ? 'flex-row-reverse' : 'flex-row'}
          `}>
            <div className="flex items-center space-x-2 text-xs text-white/50">
              {message.model_used && (
                <Badge variant="outline" className="text-white/60 text-xs">
                  {message.model_used}
                </Badge>
              )}
              {message.tokens_in && (
                <span>{message.tokens_in} tokens</span>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => copyToClipboard(message.content)}
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}