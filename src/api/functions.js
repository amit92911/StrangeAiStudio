// Standalone utility functions (Base44 removed)

/**
 * deepgramVoice: returns wsUrl and apiKey from localStorage to connect directly.
 * If you prefer the Web Speech API for STT, update VoiceMode to not call this.
 */
export async function deepgramVoice({ action }) {
  if (action !== 'transcribe') throw new Error('Unsupported action');
  const apiKey = localStorage.getItem('DEEPGRAM_API_KEY') || '';
  const wsUrl = localStorage.getItem('DEEPGRAM_WS_URL') || 'wss://api.deepgram.com/v1/listen';
  return { data: { apiKey, wsUrl } };
}

