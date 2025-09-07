import React, { useState, useEffect, useCallback } from 'react';

interface SimpleSearchProps {
  onSearch: (term: string) => void;
}

const SimpleSearch: React.FC<SimpleSearchProps> = ({ onSearch }) => {
  const [localTerm, setLocalTerm] = useState('');

  // Stable callback reference
  const debouncedOnSearch = useCallback((term: string) => {
    onSearch(term);
  }, [onSearch]);

  // Proper debouncing with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedOnSearch(localTerm);
    }, 800);

    return () => clearTimeout(timer);
  }, [localTerm, debouncedOnSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTerm(e.target.value);
  };

  return (
    <div className="relative mb-4">
      <input 
        type="text" 
        value={localTerm} 
        onChange={handleChange}
        placeholder="Search..." 
        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition" 
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default SimpleSearch;