import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send } from 'lucide-react';

interface LegalConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LegalConsultantModal: React.FC<LegalConsultantModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      setAnswer('⚠️ الرجاء كتابة سؤال.');
      return;
    }

    setIsLoading(true);
    setAnswer('⏳ جاري المعالجة...');

    try {
      const response = await fetch('https://legal-bahith-proo.onrender.com/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data.answer || '❌ لم يتم العثور على إجابة.');
    } catch (err) {
      setAnswer('❌ حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl">⚖️ مستشارك القانوني الفوري</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب سؤالك القانوني هنا..."
            className="min-h-[100px] text-base resize-none"
          />

          <Button 
            onClick={handleSubmit} 
            variant="navSuccess"
            disabled={isLoading}
            className="w-auto"
          >
            <Send className="h-4 w-4" />
            إرسال السؤال
          </Button>

          {answer && (
            <div className="bg-muted p-4 border-r-4 border-success rounded-lg min-h-[50px] max-h-[250px] overflow-y-auto whitespace-pre-wrap text-sm">
              {answer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalConsultantModal;
