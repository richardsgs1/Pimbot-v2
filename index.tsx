import React, { useEffect, useRef, memo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = marked.parse(content) as string;
      
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

        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content]);

  return <div ref={contentRef} className="prose max-w-none prose-sm sm:prose-base"></div>;
};

export default memo(MarkdownRenderer);