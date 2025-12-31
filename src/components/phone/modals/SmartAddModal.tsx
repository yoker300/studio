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
import { Mic, Sparkles, ChefHat, Check, X } from 'lucide-react';
import { AppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { smartAddItem, SmartAddItemOutput } from '@/ai/ai-smart-add-item';
import { breakDownRecipe, BreakDownRecipeOutput } from '@/ai/flows/ai-break-down-recipe';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type SmartAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
};

type View = 'input' | 'confirm' | 'ask_breakdown' | 'confirm_ingredients';

const SpeechRecognition =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;


export function SmartAddModal({ isOpen, onClose, listId }: SmartAddModalProps) {
  const context = useContext(AppContext);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [view, setView] = useState<View>('input');
  const [parsedItems, setParsedItems] = useState<SmartAddItemOutput | BreakDownRecipeOutput>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

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
      
      if (!items || items.length === 0) {
        toast({
          variant: "destructive",
          title: "No Items Found",
          description: "The AI couldn't find any items in your text.",
        });
        setIsParsing(false);
        return;
      }
      
      const isComplexItem = items.length === 1 && (items[0].category?.toLowerCase().includes('recipe') || transcript.toLowerCase().includes('recipe for'));

      if (isComplexItem) {
        setParsedItems(items);
        setView('ask_breakdown');
      } else {
        setParsedItems(items);
        const initialSelection = items.reduce((acc, item, index) => {
          acc[index] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setSelectedItems(initialSelection);
        setView('confirm');
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
    }
  }

  const handleBreakdownRecipe = async () => {
    setIsParsing(true);
    try {
      const recipeName = parsedItems[0].name;
      const ingredients = await breakDownRecipe({ recipeName });
      
      if (!ingredients || ingredients.length === 0) {
        toast({ variant: 'destructive', title: 'Breakdown Failed', description: 'Could not break down the recipe.'});
        handleAddItemAsIs(); // fallback to adding the complex item
        return;
      }

      setParsedItems(ingredients);
      const initialSelection = ingredients.reduce((acc, item, index) => {
        acc[index] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedItems(initialSelection);
      setView('confirm_ingredients');

    } catch (error) {
       console.error("AI recipe breakdown failed:", error);
       toast({ variant: 'destructive', title: 'AI Error', description: 'Could not break down recipe.'});
       handleAddItemAsIs(); // fallback to adding the complex item
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddItemAsIs = () => {
    setParsedItems(parsedItems); // Keep original parsed items
    const initialSelection = parsedItems.reduce((acc, item, index) => {
        acc[index] = true;
        return acc;
    }, {} as Record<string, boolean>);
    setSelectedItems(initialSelection);
    setView('confirm');
  }

  const handleConfirmAdd = async () => {
    if (!context) return;
    context.vibrate();
    
    const itemsToAdd = parsedItems.filter((_, index) => selectedItems[index]);
    if (itemsToAdd.length === 0) {
        toast({ title: "No items selected." });
        handleClose();
        return;
    }

    try {
        for (const item of itemsToAdd) {
            await context.addSmartItemToList(listId, {
                name: item.name,
                qty: item.qty || 1,
                category: item.category || 'Other',
                icon: item.icon || '🛒',
                urgent: item.urgent || false,
                gf: false,
                notes: '',
                store: '',
            });
        }
        toast({
            title: "Items Added!",
            description: `Added ${itemsToAdd.length} items to your list.`,
        });
    } catch(e) {
        console.error("Error adding items:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add items to the list.' });
    } finally {
        handleClose();
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setTranscript('');
    setIsListening(false);
    setIsParsing(false);
    setParsedItems([]);
    setSelectedItems({});
    setView('input');
    onClose();
  }

  const renderContent = () => {
    switch (view) {
        case 'ask_breakdown':
            return (
                <div>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><ChefHat /> Recipe Detected</DialogTitle>
                        <DialogDescription>
                           It looks like "{parsedItems[0].name}" is a recipe. Would you like to break it down into ingredients?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handleAddItemAsIs} disabled={isParsing}>
                            <X className="mr-2 h-4 w-4"/> No, Add as is
                        </Button>
                        <Button onClick={handleBreakdownRecipe} disabled={isParsing}>
                            {isParsing ? 'Breaking down...' : <><Check className="mr-2 h-4 w-4"/> Yes, break it down</>}
                        </Button>
                    </DialogFooter>
                </div>
            );
        case 'confirm':
        case 'confirm_ingredients':
            return (
                <div>
                    <DialogHeader>
                        <DialogTitle>Confirm Items</DialogTitle>
                        <DialogDescription>Select the items you want to add to your list.</DialogDescription>
                    </DialogHeader>
                    <div className="my-4 space-y-2 max-h-64 overflow-y-auto">
                        {parsedItems.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                                <Checkbox 
                                    id={`item-${index}`} 
                                    checked={selectedItems[index]}
                                    onCheckedChange={(checked) => setSelectedItems(prev => ({ ...prev, [index]: !!checked }))}
                                />
                                <Label htmlFor={`item-${index}`} className="flex-1 text-base">
                                    {item.icon} {item.name} {item.qty && item.qty > 1 ? `(x${item.qty})` : ''}
                                </Label>
                            </div>
                        ))}
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleConfirmAdd}>Add Selected Items</Button>
                    </DialogFooter>
                </div>
            );
        case 'input':
        default:
            return (
                <div>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="text-accent-foreground" />
                            AI Smart Add
                        </DialogTitle>
                        <DialogDescription>
                            Use your voice or type to add items. e.g., "6 eggs and milk" or "a recipe for lasagna".
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative my-4">
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
                </div>
            );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
