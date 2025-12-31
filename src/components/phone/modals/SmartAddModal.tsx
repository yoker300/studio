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
import { smartAddItem } from '@/ai/ai-smart-add-item';

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
  const [isParsing, setIsParsing] = useState(false);
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
      toast({ variant: 'destructive', title: 'Voice Error', description: `Could not recognize voice: ${event.error}` });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [toast]);

  const toggleListening = () => {
    if (!SpeechRecognition) {
       toast({ variant: 'destructive', title: 'Unsupported', description: 'Voice recognition is not supported in your browser.' });
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
    context?.vibrate();
  };
  
  const handleParse = async () => {
    if (!context || !transcript) return;
    context.vibrate();
    setIsParsing(true);

    try {
      const items = await smartAddItem({ voiceInput: transcript });
      if (items && items.length > 0) {
        for (const item of items) {
          // The AI flow provides corrected data, so we can add it directly
          await context.addSmartItemToList(listId, {
            name: item.name,
            qty: item.qty || 1,
            category: item.category || 'Other',
            icon: item.icon || '🛒',
            urgent: item.urgent || false,
            gf: false, // AI doesn't determine this yet
            notes: '',
            store: '',
          });
        }
        toast({
          title: "Items Added!",
          description: `Added ${items.length} items to your list.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Items Found",
          description: "The AI couldn't find any items in your text.",
        });
      }
    } catch (error) {
      console.error("AI parsing failed:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not parse items from your input.",
      });
    } finally {
      setIsParsing(false);
      onClose();
    }
  }

  // Reset state when closing
  const handleClose = () => {
    setTranscript('');
    setIsListening(false);
    setIsParsing(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleParse} disabled={!transcript || isParsing}>
            {isParsing ? 'Parsing...' : 'Parse Items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
