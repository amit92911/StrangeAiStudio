
import React, { useState, useEffect, useRef } from "react";
import { Chat as ChatEntity, Message, Project } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send,
  Mic,
  Square,
  Settings,
  Paperclip,
  Sparkles,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Plus
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import MessageBubble from "../components/chat/MessageBubble";
import ModelSelector from "../components/chat/ModelSelector";
import VoiceMode from "../components/chat/VoiceMode";
import ChatSettings from "../components/chat/ChatSettings";
import ChatSidebar from "../components/chat/ChatSidebar";
import SettingsPanel from "../components/chat/SettingsPanel";

// Audio Wave Animation Component
const AudioWave = ({ isActive }) => {
  const [waveBars, setWaveBars] = useState([0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setWaveBars(prev => {
        // Create a wave-like animation
        return prev.map((height, index) => {
          const base = 0.2;
          const amplitude = 0.8;
          const frequency = 0.5;
          const phase = Date.now() * 0.001 * frequency;
          const wave = Math.sin(phase + index * 0.5) * amplitude + base;
          return Math.max(0.1, Math.min(1.0, wave));
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-end justify-center space-x-1 h-8">
      {waveBars.map((height, index) => (
        <div
          key={index}
          className="w-1 bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-full transition-all duration-100"
          style={{
            height: `${height * 32}px`,
            opacity: isActive ? 0.8 + height * 0.2 : 0.3
          }}
        />
      ))}
    </div>
  );
};

const providers = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'google', name: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] }
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // Voice call integration state
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallTranscript, setVoiceCallTranscript] = useState([]);
  const [isVoiceCallMuted, setIsVoiceCallMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.id);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    const projectData = await Project.list('-created_date');
    setProjects(projectData);
    
    if (projectData.length > 0) {
      setSelectedProject(projectData[0]);
      await loadChats(projectData[0].id);
    }
  };

  const loadChats = async (projectId) => {
    const chatData = await ChatEntity.filter({ project_id: projectId }, '-updated_date');
    setChats(chatData);
    
    // Load the most recent chat if available
    if (chatData.length > 0) {
      setCurrentChat(chatData[0]);
      setSelectedModel(chatData[0].current_model || selectedModel);
      setSelectedProvider(chatData[0].provider || selectedProvider);
    }
  };

  const loadMessages = async (chatId) => {
    const messageData = await Message.filter({ chat_id: chatId }, 'created_date');
    setMessages(messageData);
  };

  const createNewChat = async () => {
    if (!selectedProject) return;
    
    const newChat = await ChatEntity.create({
      project_id: selectedProject.id,
      title: "New Chat",
      current_model: selectedModel,
      provider: selectedProvider
    });
    
    setCurrentChat(newChat);
    setMessages([]);
    
    // Refresh chats list
    await loadChats(selectedProject.id);
  };

  const switchChat = async (chat) => {
    setCurrentChat(chat);
    setSelectedModel(chat.current_model || selectedModel);
    setSelectedProvider(chat.provider || selectedProvider);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat) return;

    const userMessage = {
      role: "user",
      content: input,
      chat_id: currentChat.id
    };

    // Add user message immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const currentInput = input;
    setInput("");
    setIsStreaming(true);

    // Add placeholder for assistant response
    const assistantPlaceholder = {
      role: "assistant", 
      content: "",
      chat_id: currentChat.id,
      model_used: selectedModel,
      provider_used: selectedProvider
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      // Save user message to DB
      await Message.create(userMessage);

      // Construct prompt with conversation history
      const history = newMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      const systemPrompt = selectedProject?.system_prompt || "You are a helpful AI assistant.";
      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${history}\n\nRespond to the last user message naturally and helpfully.`;

      // Call LLM
      const response = await InvokeLLM({ prompt: fullPrompt });
      const assistantContent = typeof response === 'object' ? response.output || JSON.stringify(response) : response;

      // Simulate streaming effect
      let streamedContent = "";
      const words = assistantContent.split(/(\s+)/);
      
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 30));
        streamedContent += word;
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].content = streamedContent;
          return updatedMessages;
        });
      }

      // Save complete assistant message
      const savedMessage = await Message.create({
        ...assistantPlaceholder,
        content: assistantContent
      });

      // Auto-rename chat if it's the first exchange
      if (newMessages.length === 1) {
        try {
          const titleResponse = await InvokeLLM({ 
            prompt: `Generate a short, descriptive title (3-5 words) for a conversation that starts with: "${currentInput}". Return only the title, no quotes or extra text.` 
          });
          const newTitle = (typeof titleResponse === 'object' ? titleResponse.output : titleResponse)
            .replace(/['"]/g, '').trim().slice(0, 50);
          
          await ChatEntity.update(currentChat.id, { title: newTitle });
          setCurrentChat(prev => ({ ...prev, title: newTitle }));
          
          // Refresh chats list to show updated title
          await loadChats(selectedProject.id);
        } catch (titleError) {
          console.warn("Could not generate title:", titleError);
        }
      }

      // Update chat's updated_date
      await ChatEntity.update(currentChat.id, { 
        current_model: selectedModel,
        provider: selectedProvider 
      });

    } catch (error) {
      console.error("Error calling LLM:", error);
      const errorContent = "Sorry, I encountered an error. Please try again.";
      
      setMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = {
          ...assistantPlaceholder,
          content: errorContent,
          isError: true
        };
        return updatedMessages;
      });
      
      await Message.create({ ...assistantPlaceholder, content: errorContent });
    } finally {
      setIsStreaming(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice call functions
  const startVoiceCall = () => {
    setIsVoiceCallActive(true);
    setVoiceCallTranscript([]);
    // In a real implementation, this would initialize the voice call
    console.log('Starting voice call...');
  };

  const endVoiceCall = () => {
    setIsVoiceCallActive(false);
    setIsUserSpeaking(false);
    setVoiceCallTranscript([]);
    console.log('Ending voice call...');
  };

  const toggleVoiceMute = () => {
    setIsVoiceCallMuted(!isVoiceCallMuted);
    console.log(`Voice call ${!isVoiceCallMuted ? 'muted' : 'unmuted'}`);
  };

  const handleVoiceTranscript = (transcriptEntries) => {
    setVoiceCallTranscript(transcriptEntries);
    // Save voice transcripts to messages
    if (currentChat && transcriptEntries.length > 0) {
      const formattedTranscript = transcriptEntries.map(entry =>
        `*${entry.speaker}*: ${entry.text}`
      ).join('\n');

      // Add as a system message for voice conversation
      Message.create({
        chat_id: currentChat.id,
        role: "system",
        content: formattedTranscript,
        isVoiceTranscript: true
      }).then(() => {
        loadMessages(currentChat.id);
      });
    }
  };

  return (
    <div className="h-full flex bg-transparent">
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatSidebarOpen}
        chats={chats}
        currentChat={currentChat}
        projects={projects}
        selectedProject={selectedProject}
        onChatSelect={switchChat}
        onNewChat={createNewChat}
        onProjectSelect={async (project) => {
          setSelectedProject(project);
          await loadChats(project.id);
        }}
        onClose={() => setIsChatSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-card/60 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              
              <div>
                <h2 className="text-lg font-semibold text-white/95">
                  {currentChat?.title || "Select or create a chat"}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-white/60">
                  <span>{selectedProvider}</span>
                  <span>•</span>
                  <span>{selectedModel}</span>
                  {selectedProject && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="border-white/10 text-white/60">
                        {selectedProject.name}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ModelSelector
                providers={providers}
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={setSelectedProvider}
                onModelChange={setSelectedModel}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className={`text-white/60 hover:text-white hover:bg-white/10 ${isVoiceCallActive ? 'text-emerald-400' : ''}`}
                onClick={isVoiceCallActive ? endVoiceCall : startVoiceCall}
              >
                {isVoiceCallActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!currentChat ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-zinc-100" />
                </div>
                <h3 className="text-xl font-semibold text-white/95 mb-2 brand-strangeai-title">
                  Welcome to strangeAi
                </h3>
                <p className="text-white/60 mb-6">
                  Create a new chat or select an existing one to start
                </p>
                <Button
                  onClick={createNewChat}
                  className="bg-slate-700 hover:bg-slate-600"
                  disabled={!selectedProject}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-zinc-100" />
                </div>
                <h3 className="text-xl font-semibold text-white/95 mb-2">
                  Start a conversation
                </h3>
                <p className="text-white/60">
                  Ask anything or try voice mode for a natural conversation
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index}>
                  {message.isVoiceTranscript ? (
                    // Voice transcript formatting
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-400/20 rounded-lg px-4 py-2 max-w-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                          <span className="text-xs font-medium text-emerald-400">Voice Call</span>
                        </div>
                        <div className="text-sm text-white/80 italic font-light leading-relaxed">
                          {message.content.split('\n').map((line, i) => (
                            <div key={i} className="mb-1">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MessageBubble message={message} />
                  )}
                </div>
              ))
            )}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        {currentChat && (
          <div className="bg-card/60 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="max-w-4xl mx-auto">
              {isVoiceCallActive ? (
                // Voice Call Interface
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-white/90 font-medium">Voice Call Active</span>
                      </div>
                      <Badge variant="outline" className="border-emerald-400/20 text-emerald-300">
                        Barge-in Active
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVoiceMute}
                        className={`${isVoiceCallMuted ? 'text-red-400' : 'text-white/60'} hover:text-white hover:bg-white/10`}
                      >
                        {isVoiceCallMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={endVoiceCall}
                        variant="destructive"
                        size="icon"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Live Transcript Display */}
                  {voiceCallTranscript.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <div className="text-xs text-white/60 mb-2">Live Transcript</div>
                      <div className="space-y-1">
                        {voiceCallTranscript.slice(-3).map((entry, index) => (
                          <div key={index} className="text-sm">
                            <span className={`font-medium ${entry.speaker === 'User' ? 'text-emerald-400' : 'text-violet-400'}`}>
                              {entry.speaker}:
                            </span>
                            <span className="text-white/80 ml-2 italic font-light">{entry.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Wave Visualization */}
                  <div className="flex justify-center">
                    <AudioWave isActive={isUserSpeaking} />
                  </div>
                </div>
              ) : (
                // Regular Text Input
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    className="min-h-[60px] max-h-[200px] pr-32 text-zinc-200 placeholder:text-white/40 focus:border-indigo-500/50 focus:ring-indigo-500/20 resize-none"
                  />

                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startVoiceCall}
                      className="text-white/60 hover:text-emerald-400 hover:bg-emerald-400/10"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isStreaming}
                      className="bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        currentChat={currentChat}
        selectedModel={selectedModel}
        selectedProvider={selectedProvider}
        onTranscriptSave={async (transcriptEntries) => {
          if (currentChat && transcriptEntries.length > 0) {
            const formattedTranscript = transcriptEntries.map(entry => 
              `**${entry.speaker}**: ${entry.text}`
            ).join('\n\n');

            await Message.create({
              chat_id: currentChat.id,
              role: "system",
              content: `### Voice Conversation Transcript\n\n${formattedTranscript}`
            });
            await loadMessages(currentChat.id);
          }
        }}
      />



      {/* Settings Modal */}
      {showSettings && (
        <ChatSettings
          onClose={() => setShowSettings(false)}
          currentChat={currentChat}
        />
      )}
    </div>
  );
}
