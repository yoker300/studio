'use client';

import { useState, useContext, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Sparkles } from 'lucide-react';
import { AppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

type SmartAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
};

// Check for SpeechRecognition API
const SpeechRecognition =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;


export function SmartAddModal({ isOpen, onClose, listId }: SmartAddModalProps) {
  const context = useContext(AppContext);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);


  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!SpeechRecognition) {
       toast({ variant: 'destructive', title: 'Unsupported', description: 'Voice recognition is not supported in your browser.' });
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
    context?.vibrate();
  };
  
  const handleParse = () => {
    context?.vibrate();
    toast({
      title: "Coming Soon!",
      description: "AI parsing of text is not yet implemented.",
    });
    // In a future version, we would send `transcript` to a Gemini flow
    // and then add the returned items to the list.
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-accent-foreground" />
            AI Smart Add
          </DialogTitle>
          <DialogDescription>
            Use your voice to add items to your list. For example, "6 eggs and milk".
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Textarea
            placeholder={isListening ? 'Listening...' : 'Tap the mic to start or type here...'}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
          />
          <Button
            size="icon"
            onClick={toggleListening}
            className={`absolute bottom-2 right-2 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            <Mic />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleParse} disabled={!transcript}>Parse Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
