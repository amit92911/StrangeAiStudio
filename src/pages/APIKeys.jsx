import React, { useEffect, useState } from 'react';
import { Key, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function APIKeysPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('OPENAI_API_KEY') || '');
    setOpenaiModel(localStorage.getItem('OPENAI_MODEL') || 'gpt-4o-mini');
  }, []);

  const save = () => {
    localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    localStorage.setItem('OPENAI_MODEL', openaiModel.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearAll = () => {
    localStorage.removeItem('OPENAI_API_KEY');
    localStorage.removeItem('OPENAI_MODEL');
    setOpenaiKey('');
    setOpenaiModel('gpt-4o-mini');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">API Keys</h1>
          <p className="text-zinc-500">Manage your API keys and model configurations</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* OpenAI Configuration */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600/20 to-green-700/20 flex items-center justify-center border border-green-600/30">
                <Key className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">OpenAI Configuration</h2>
                <p className="text-sm text-zinc-500">Configure your OpenAI API settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-3 pr-12 placeholder:text-zinc-600 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Your API key is stored locally in your browser
                </p>
              </div>
              
              {/* Model Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Default Model
                </label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/20 transition-all duration-200"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
                <p className="text-xs text-zinc-600 mt-2">
                  The default model to use for new conversations
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-zinc-800">
              <Button 
                onClick={save}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
              <Button 
                onClick={clearAll}
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              
              {saved && (
                <div className="flex items-center space-x-2 text-green-400 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium">Configuration saved</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="bg-amber-900/10 border border-amber-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-400 mb-1">Security Notice</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  API keys are stored locally in your browser's localStorage. Never share your API keys publicly or commit them to version control. 
                  For production use, implement proper backend API key management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}