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
              ? 'bg-indigo-600' 
              : isError
                ? 'bg-red-600'
                : 'bg-zinc-800 border border-zinc-700'
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
              ? 'bg-indigo-600/15 border border-indigo-500/30' 
              : isError
                ? 'bg-red-600/15 border border-red-500/30'
                : 'bg-zinc-900 border border-zinc-800'
            }
          `}>
            {isUser ? (
              <p className="text-white/92 leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  className="text-zinc-200 leading-relaxed"
                  components={{
                    code: ({ inline, className, children, ...props }) => {
                      return inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
                          <code className="text-zinc-200 text-sm font-mono">{children}</code>
                        </pre>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 text-zinc-100">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-zinc-100">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-zinc-100">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-2 text-zinc-300">
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
            <div className="flex items-center space-x-2 text-xs text-zinc-500">
              {message.model_used && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
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
              className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
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