import React, { useEffect, useState } from 'react';

export default function APIKeysPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('OPENAI_API_KEY') || '');
    setOpenaiModel(localStorage.getItem('OPENAI_MODEL') || 'gpt-4o-mini');
  }, []);

  const save = () => {
    localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    localStorage.setItem('OPENAI_MODEL', openaiModel.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const clearAll = () => {
    localStorage.removeItem('OPENAI_API_KEY');
    localStorage.removeItem('OPENAI_MODEL');
    setOpenaiKey('');
    setOpenaiModel('gpt-4o-mini');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-800 p-4">
        <h1 className="text-xl font-semibold text-zinc-200">API Keys</h1>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-4">
            <h2 className="text-zinc-200 font-semibold mb-3">OpenAI (optional)</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400">API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-1 w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Model</label>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="mt-1 w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500">Save</button>
            <button onClick={clearAll} className="px-4 py-2 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700">Clear</button>
            {saved && <span className="text-green-300 text-sm">Saved</span>}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Keys are stored locally in your browser via localStorage. Do not use production keys in this demo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}