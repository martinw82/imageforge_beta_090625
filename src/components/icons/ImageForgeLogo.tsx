import type React from 'react';

const ImageForgeLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
    <path d="M12 3v2.5" />
    <path d="M12 18.5V21" />
    <path d="M3 12h2.5" />
    <path d="M18.5 12H21" />
    <path d="m4.22 19.78 1.42-1.42" />
    <path d="m18.36 5.64 1.42-1.42" />
    <path d="m19.78 19.78-1.42-1.42" />
    <path d="m5.64 5.64-1.42-1.42" />
  </svg>
);

export default ImageForgeLogo;
