type Props = { size?: number; className?: string };

const def = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconHome = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const IconList = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </svg>
);

export const IconSettings = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IconInfo = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </svg>
);

export const IconSearch = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const IconPlus = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconClose = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconTrash = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

export const IconDrag = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="9" cy="6" r="1.2" fill="currentColor" />
    <circle cx="15" cy="6" r="1.2" fill="currentColor" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9" cy="18" r="1.2" fill="currentColor" />
    <circle cx="15" cy="18" r="1.2" fill="currentColor" />
  </svg>
);

export const IconPrint = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M6 9V3h12v6" />
    <rect x="4" y="9" width="16" height="9" rx="2" />
    <path d="M6 18h12v3H6z" />
  </svg>
);

export const IconHelp = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 4 2c-.8.5-1.5 1-1.5 2M12 17h.01" />
  </svg>
);

export const IconDownload = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export const IconEye = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconHeart = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M20.8 6.6a5.5 5.5 0 0 0-9.3-2.1L12 5l-.5-.5A5.5 5.5 0 0 0 3.2 6.6a5.5 5.5 0 0 0 1.6 4.5l6.5 6.5a1 1 0 0 0 1.4 0l6.5-6.5a5.5 5.5 0 0 0 1.6-4.5z" />
  </svg>
);

export const IconChevronLeft = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const IconArrowRight = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const IconStar = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
);

export const IconHand = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M9 11V5a1.5 1.5 0 1 1 3 0v5" />
    <path d="M12 10V4a1.5 1.5 0 1 1 3 0v7" />
    <path d="M15 11V6a1.5 1.5 0 1 1 3 0v8c0 4-3 7-7 7s-6-2-7-5l-2-5a1.5 1.5 0 1 1 2.6-1.5l1.4 2" />
  </svg>
);

export const IconUsers = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
    <path d="M15 19c0-2 1.5-3.5 4-3.5S22 17 22 19" />
  </svg>
);

export const IconSparkles = ({ size, className }: Props) => (
  <svg {...def(size)} className={className}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);
