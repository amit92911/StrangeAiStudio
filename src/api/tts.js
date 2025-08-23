// Provider-agnostic TTS utilities: WebSpeech (fallback), OpenAI, Google

const fetchJson = async (url, options) => {
  const resp = await fetch(url, options);
  if (!resp.ok) throw new Error(`${url} ${resp.status}`);
  return resp.json();
};

export const TTSProvider = {
  WebSpeech: 'webspeech',
  OpenAI: 'openai',
  Google: 'google',
};

export function getDefaultTTSProvider() {
  return localStorage.getItem('TTS_PROVIDER') || TTSProvider.WebSpeech;
}

export function setDefaultTTSProvider(provider) {
  localStorage.setItem('TTS_PROVIDER', provider);
}

export function getDefaultTTSVoice() {
  return localStorage.getItem('TTS_VOICE') || '';
}

export function setDefaultTTSVoice(voice) {
  localStorage.setItem('TTS_VOICE', voice);
}

// WebSpeech voices from browser
export async function listWebSpeechVoices() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([]);
    const synth = window.speechSynthesis;
    const load = () => resolve(synth.getVoices() || []);
    synth.onvoiceschanged = load;
    const v = synth.getVoices();
    if (v && v.length) resolve(v);
    else setTimeout(load, 300);
  });
}

// OpenAI TTS: uses audio.speech endpoint; returns audio as Blob URL
export async function synthesizeOpenAI(text, voice = 'alloy', format = 'mp3') {
  const apiKey = localStorage.getItem('OPENAI_API_KEY');
  if (!apiKey) throw new Error('Missing OpenAI API key');

  const model = 'gpt-4o-mini-tts';
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      format,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI TTS ${resp.status}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

export const OPENAI_TTS_VOICES = [
  'alloy', 'verse', 'aria', 'bright', 'calypso', 'dusk', 'lumen', 'siren'
];

// Google Cloud TTS
export async function synthesizeGoogle(text, voiceName = 'en-US-Neural2-C', audioEncoding = 'MP3') {
  const apiKey = localStorage.getItem('GOOGLE_TTS_API_KEY');
  if (!apiKey) throw new Error('Missing Google TTS API key');

  const body = {
    input: { text },
    voice: { languageCode: (voiceName.split('-').slice(0,2).join('-')) || 'en-US', name: voiceName },
    audioConfig: { audioEncoding },
  };

  const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
  const json = await resp.json();
  const b64 = json?.audioContent;
  if (!b64) throw new Error('Empty audioContent');
  const blob = b64ToBlob(b64, 'audio/mp3');
  return URL.createObjectURL(blob);
}

export async function listGoogleVoices() {
  const apiKey = localStorage.getItem('GOOGLE_TTS_API_KEY');
  if (!apiKey) return [];
  try {
    const json = await fetchJson(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
    return json?.voices || [];
  } catch {
    return [];
  }
}

function b64ToBlob(base64, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

// High-level API
export async function listVoices(provider) {
  if (provider === TTSProvider.OpenAI) {
    return OPENAI_TTS_VOICES.map(v => ({ id: v, name: v }));
  }
  if (provider === TTSProvider.Google) {
    const voices = await listGoogleVoices();
    return voices.map(v => ({ id: v.name, name: `${v.name} (${v.languageCodes?.[0] || ''})` }));
  }
  // WebSpeech fallback
  const voices = await listWebSpeechVoices();
  return voices.map(v => ({ id: v.voiceURI, name: `${v.name} (${v.lang})`, meta: v }));
}

export async function getAudioURL(provider, text, voiceId) {
  try {
    if (provider === TTSProvider.OpenAI) {
      return await synthesizeOpenAI(text, voiceId);
    }
    if (provider === TTSProvider.Google) {
      return await synthesizeGoogle(text, voiceId);
    }
  } catch (error) {
    console.warn(`TTS provider ${provider} failed:`, error.message);
    console.warn('Falling back to WebSpeech API...');
  }

  // WebSpeech does not return URL; handled directly by speechSynthesis
  return null;
}




