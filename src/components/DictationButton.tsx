import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface DictationButtonProps {
  onResult: (transcript: string) => void;
  title?: string;
}

/** Bouton micro basé sur la reconnaissance vocale du navigateur (Web Speech
 * API) — gratuit, aucun service externe. Non disponible sur tous les
 * navigateurs (Firefox notamment) : le bouton disparaît simplement si non
 * supporté, plutôt que de promettre une fonctionnalité cassée. */
export function DictationButton({ onResult, title }: DictationButtonProps) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ');
      if (transcript.trim()) onResult(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`dictation-button${listening ? ' listening' : ''}`}
      onClick={toggle}
      title={title ?? (listening ? 'Arrêter la dictée' : 'Dicter')}
      aria-label={listening ? 'Arrêter la dictée' : 'Dicter'}
    >
      {listening ? '🔴' : '🎤'}
    </button>
  );
}
