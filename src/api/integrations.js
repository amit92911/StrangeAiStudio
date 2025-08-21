// Standalone integrations layer (Base44 removed)

/**
 * InvokeLLM: simple local mock that returns a plausible completion.
 * Tries OpenAI if OPENAI_API_KEY is present; otherwise returns a mock.
 */
export async function InvokeLLM({ prompt }) {
  try {
    const openaiKey = localStorage.getItem('OPENAI_API_KEY');
    const model = localStorage.getItem('OPENAI_MODEL') || 'gpt-4o-mini';
    if (openaiKey) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
      const json = await resp.json();
      const output = json?.choices?.[0]?.message?.content || '';
      return { output };
    }
  } catch (err) {
    console.warn('Provider call failed, falling back to mock:', err);
  }

  const trimmed = (prompt || '').slice(-240);
  const summary = trimmed.split(/\n/).filter(Boolean).slice(-3).join(' ');
  const output = summary
    ? `Here’s a helpful response based on your last input: ${summary}`
    : 'Hello! How can I help you today?';
  await new Promise(r => setTimeout(r, 200));
  return { output };
}

// No-op stubs to keep imports working if referenced later
export async function SendEmail() { throw new Error('SendEmail is not implemented.'); }
export async function UploadFile() { throw new Error('UploadFile is not implemented.'); }
export async function GenerateImage() { throw new Error('GenerateImage is not implemented.'); }
export async function ExtractDataFromUploadedFile() { throw new Error('ExtractDataFromUploadedFile is not implemented.'); }