export default function LoginIllustration() {
  return (
    <svg
      viewBox="0 0 560 520"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-md"
      role="img"
      aria-label="Illustration of a candidate searching for jobs on a laptop"
    >
      {/* Soft background blob */}
      <circle cx="330" cy="300" r="190" fill="#DCE6FB" />

      {/* Decorative plus / dot shapes */}
      <g stroke="#93B4E8" strokeWidth="3" strokeLinecap="round">
        <path d="M470 150 h16 M478 142 v16" />
        <path d="M60 300 h14 M67 293 v14" />
      </g>
      <circle cx="500" cy="230" r="4" fill="#93B4E8" />
      <circle cx="40" cy="230" r="4" fill="#93B4E8" />
      <circle cx="500" cy="380" r="4" fill="#93B4E8" />

      {/* Browser window (job search card) */}
      <g>
        <rect x="120" y="60" width="270" height="210" rx="10" fill="#FFFFFF" stroke="#D7E1F5" strokeWidth="1.5" />
        <rect x="120" y="60" width="270" height="34" rx="10" fill="#EAF0FC" />
        <rect x="120" y="84" width="270" height="10" fill="#EAF0FC" />
        <circle cx="138" cy="77" r="4" fill="#B9CCEF" />
        <circle cx="152" cy="77" r="4" fill="#B9CCEF" />
        <circle cx="166" cy="77" r="4" fill="#B9CCEF" />

        {/* search bar */}
        <rect x="136" y="106" width="238" height="26" rx="6" fill="#EEF3FD" />
        <text x="146" y="123" fontFamily="Arial, sans-serif" fontSize="12" fill="#2F6FE0" fontWeight="600">
          Job Search
        </text>
        <circle cx="358" cy="119" r="8" fill="#2F6FE0" />
        <circle cx="356" cy="117" r="3.2" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="358.5" y1="119.5" x2="361" y2="122" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* candidate rows */}
        {[152, 190, 228].map((y) => (
          <g key={y}>
            <rect x="136" y={y} width="238" height="30" rx="6" fill="#F5F8FE" />
            <circle cx="152" cy={y + 15} r="10" fill="#B9CCEF" />
            <rect x="172" y={y + 8} width="120" height="6" rx="3" fill="#C9D8F4" />
            <rect x="172" y={y + 18} width="80" height="6" rx="3" fill="#DCE6FB" />
          </g>
        ))}
      </g>

      {/* Plant */}
      <g>
        <rect x="118" y="430" width="46" height="40" rx="4" fill="#2F6FE0" />
        <path d="M141 430 C 110 400 105 360 120 335 C 140 365 138 400 141 430 Z" fill="#1E4FB8" />
        <path d="M141 430 C 172 400 177 360 162 335 C 142 365 144 400 141 430 Z" fill="#2F6FE0" />
        <path d="M141 430 C 121 390 125 350 141 320 C 157 350 161 390 141 430 Z" fill="#4A82E6" />
      </g>

      {/* Chair */}
      <g>
        <path d="M300 300 L440 300 L455 470 L285 470 Z" fill="#2B6BD8" />
        <rect x="292" y="300" width="156" height="16" rx="6" fill="#1E4FB8" />
        <line x1="292" y1="470" x2="280" y2="500" stroke="#16264A" strokeWidth="6" strokeLinecap="round" />
        <line x1="452" y1="470" x2="464" y2="500" stroke="#16264A" strokeWidth="6" strokeLinecap="round" />
        <line x1="330" y1="470" x2="325" y2="500" stroke="#16264A" strokeWidth="6" strokeLinecap="round" />
        <line x1="410" y1="470" x2="415" y2="500" stroke="#16264A" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Person body / legs */}
      <path d="M310 430 C 300 460 300 480 310 500 L340 500 C 335 470 340 445 345 425 Z" fill="#16264A" />
      <path d="M395 430 C 405 460 405 480 398 500 L368 500 C 372 470 368 445 362 425 Z" fill="#16264A" />
      {/* shoes */}
      <ellipse cx="315" cy="503" rx="20" ry="8" fill="#2F6FE0" />
      <ellipse cx="393" cy="503" rx="20" ry="8" fill="#2F6FE0" />

      {/* Torso / sweater */}
      <path d="M300 300 C 295 340 300 390 315 425 L395 425 C 408 390 410 340 400 300 C 380 285 320 285 300 300 Z" fill="#2F6FE0" />

      {/* Arms to laptop */}
      <path d="M300 320 C 270 335 255 355 260 375 L285 385 C 290 365 300 345 312 330 Z" fill="#2F6FE0" />
      <path d="M400 320 C 430 335 445 355 440 375 L415 385 C 410 365 400 345 388 330 Z" fill="#2F6FE0" />
      {/* hands */}
      <circle cx="270" cy="380" r="9" fill="#F2B48C" />
      <circle cx="432" cy="380" r="9" fill="#F2B48C" />

      {/* Neck + head */}
      <rect x="335" y="270" width="26" height="24" rx="8" fill="#F2B48C" />
      <circle cx="348" cy="255" r="30" fill="#F7C9A3" />

      {/* Hair */}
      <path d="M318 250 C 314 220 330 200 348 200 C 368 200 384 220 380 252 C 378 240 372 232 366 236 C 366 226 356 218 348 218 C 340 218 332 226 330 238 C 324 234 320 240 318 250 Z" fill="#22283A" />
      <path d="M320 255 C 314 275 314 300 322 315 L332 312 C 328 295 328 275 332 258 Z" fill="#22283A" />
      <path d="M376 255 C 382 275 382 300 374 315 L364 312 C 368 295 368 275 364 258 Z" fill="#22283A" />

      {/* face details */}
      <circle cx="339" cy="257" r="2.4" fill="#2A2A2A" />
      <circle cx="359" cy="257" r="2.4" fill="#2A2A2A" />
      <path d="M341 268 Q348 273 355 268" stroke="#C97C56" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Laptop */}
      <g>
        <path d="M300 378 L396 378 L404 400 L292 400 Z" fill="#274B8E" />
        <path d="M304 340 L392 340 L396 378 L300 378 Z" fill="#3A6FD1" />
        <rect x="316" y="348" width="64" height="22" rx="2" fill="#9FC0F0" opacity="0.7" />
      </g>
    </svg>
  );
}