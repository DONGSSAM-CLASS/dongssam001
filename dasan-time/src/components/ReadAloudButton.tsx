import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, speechSupported, stopSpeaking } from '../lib/speech';
import { UI_TEXT } from '../content/lessons';

/** 긴 안내문 옆에 붙는 '소리로 듣기' 버튼 */
export default function ReadAloudButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!speechSupported()) return null;

  return (
    <button
      type="button"
      className={`btn btn-sm rounded-2xl ${playing ? 'btn-warning' : 'btn-ghost'}`}
      aria-label={playing ? UI_TEXT.readAloudStop : UI_TEXT.readAloud}
      onClick={() => {
        if (playing) {
          stopSpeaking();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        speak(text, () => setPlaying(false));
      }}
    >
      {playing ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      {playing ? UI_TEXT.readAloudStop : UI_TEXT.readAloud}
    </button>
  );
}
