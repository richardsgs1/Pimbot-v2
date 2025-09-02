import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const inlineRender = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-cyan-400 rounded px-1.5 py-1 text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br />');
  };

  const renderBlock = (block: string, index: number) => {
    // Code blocks
    if (block.startsWith('```') && block.endsWith('```')) {
      const code = block.slice(3, -3).trim();
      return (
        <pre key={index} className="bg-slate-900/70 border border-slate-700 rounded-md p-4 my-2 text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
      );
    }
    
    const lines = block.split('\n');

    // Unordered lists
    const isUl = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
    if (isUl) {
      return (
        <ul key={index} className="list-disc list-inside space-y-1 my-2">
          {lines.map((line, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.replace(/^\s*[\*\-]\s/, '')) }} />
          ))}
        </ul>
      );
    }

    // Ordered lists
    const isOl = lines.every(line => line.trim().match(/^\d+\.\s/));
    if (isOl) {
       return (
        <ol key={index} className="list-decimal list-inside space-y-1 my-2">
          {lines.map((line, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.replace(/^\s*\d+\.\s/, '')) }} />
          ))}
        </ol>
      );
    }

    // Paragraphs
    return (
      <p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: inlineRender(block) }} />
    );
  };

  // Split content by code blocks and then by empty lines for other blocks
  const blocks = content.split(/(```[\s\S]*?```)/g).flatMap(part => {
      if (part.startsWith('```')) return [part.trim()];
      return part.split(/\n\s*\n/); // Split by one or more empty lines
  }).filter(block => block.trim() !== '');

  return (
    <div className="text-slate-300 leading-relaxed">
      {blocks.map(renderBlock)}
    </div>
  );
};

export default MarkdownRenderer;