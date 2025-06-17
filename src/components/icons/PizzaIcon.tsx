import type { SVGProps } from 'react';

export function PizzaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 4v7l5 2-5-9z" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="10" cy="9" r="1" />
      <circle cx="14" cy="9" r="1" />
      <circle cx="9" cy="14.5" r="1" />
      <circle cx="15" cy="14.5" r="1" />
    </svg>
  );
}
