import React from 'react';

/**
 * Coach answers arrive as plain text with \n line breaks and **bold** markers.
 * Plain <p> collapses every newline into one paragraph and shows the asterisks raw,
 * so this renders the same string with line breaks kept and bold segments styled.
 */
const BOLD = /(\*\*[^*]+\*\*)/g;

function inline(text, keyPrefix) {
  return text
    .split(BOLD)
    .filter((part) => part !== '')
    .map((part, i) => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${i}`} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
    });
}

export default function CoachText({ text, className = '' }) {
  if (text === null || text === undefined || text === '') return null;
  const clean = String(text).replace(/\r\n?/g, '\n');
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`} style={{ lineHeight: 1.6 }}>
      {inline(clean, 'coach')}
    </div>
  );
}
