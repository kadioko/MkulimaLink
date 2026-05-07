import React from 'react';

const SkipLink = ({ targetId, children = 'Skip to main content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
    >
      {children}
    </a>
  );
};

export default SkipLink;
