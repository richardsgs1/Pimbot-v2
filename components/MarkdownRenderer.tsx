import React, { useEffect, useRef, memo } from 'react';

// To inform TypeScript about the global variables from the CDN scripts
declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
    hljs: {
      highlightElement: (element: HTMLElement) => void;
    };
  }
}

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && window.marked) {
      contentRef.current.innerHTML = window.marked.parse(content);
      
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        const preElement = block.parentElement as HTMLPreElement;
        
        if (preElement.querySelector('.copy-button')) {
          preElement.querySelector('.copy-button')!.remove();
        }

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerText = 'Copy';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        copyButton.onclick = () => {
          if (block.textContent) {
            navigator.clipboard.writeText(block.textContent);
            copyButton.innerText = 'Copied!';
            setTimeout(() => {
              copyButton.innerText = 'Copy';
            }, 2000);
          }
        };
        preElement.appendChild(copyButton);

        if (window.hljs) {
            window.hljs.highlightElement(block as HTMLElement);
        }
      });
    }
  }, [content]);

  return <div ref={contentRef} className="prose max-w-none prose-sm sm:prose-base"></div>;
};

export default memo(MarkdownRenderer);