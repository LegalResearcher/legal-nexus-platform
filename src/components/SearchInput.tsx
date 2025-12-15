import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "ابحث هنا عن الكتب أو القوانين..." 
}) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pr-12 text-base border-2 border-input rounded-lg bg-card focus:border-navy dark:focus:border-accent transition-colors"
      />
    </div>
  );
};

export default SearchInput;
