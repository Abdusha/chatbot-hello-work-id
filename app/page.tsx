'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: input,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'No response received',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error?.message || 'Failed to get response'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <h1 className="text-3xl font-bold">Hello Work ID</h1>
        <p className="text-muted-foreground mt-1">
          Career Assistant & Indonesian Labor Law Chatbot
        </p>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Hello Work ID</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Get instant answers about career guidance, Indonesian labor law, employment contracts, and workplace policies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                <Card className="p-4">
                  <p className="text-sm font-medium">💼 Career Guidance</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium">⚖️ Labor Law</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium">📋 Employment Contracts</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium">🏢 Workplace Policies</p>
                </Card>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-3 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card p-6">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
