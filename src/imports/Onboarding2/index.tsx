export default function Onboarding() {
  return (
    <div className="bg-[#0b0b12] relative size-full" data-name="Onboarding 2">
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] left-[348px] not-italic text-[#8c8ca3] text-[13px] top-[28px] whitespace-nowrap">Skip</p>
      <div className="absolute left-[24px] size-[64px] top-[360px]" data-name="orb">
        <div className="absolute inset-[-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 72 72">
            <g filter="url(#filter0_f_1_42)" id="orb">
              <circle cx="36" cy="36" fill="var(--fill-0, #2DE2C8)" fillOpacity="0.2" r="32" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="72" id="filter0_f_1_42" width="72" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_42" stdDeviation="2" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[24px] not-italic text-[#f4f4fa] text-[30px] top-[450px] tracking-[-0.6px] w-[364px]">Effort, not just time</p>
      <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[24px] not-italic text-[#8c8ca3] text-[16px] top-[510px] w-[320px]">Every session tracks heart rate, calories and effort zones — synced from your Apple Watch or Wear OS in the app.</p>
      <div className="absolute bg-[#1e1e2c] h-[4px] left-[24px] rounded-[2px] top-[782px] w-[117.333px]" data-name="Rectangle" />
      <div className="absolute bg-[#2de2c8] h-[4px] left-[147.33px] rounded-[2px] top-[782px] w-[117.333px]" data-name="Rectangle" />
      <div className="absolute bg-[#1e1e2c] h-[4px] left-[270.67px] rounded-[2px] top-[782px] w-[117.333px]" data-name="Rectangle" />
      <div className="absolute bg-[#2de2c8] h-[56px] left-[24px] rounded-[14px] top-[802px] w-[364px]" data-name="btn-next" />
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[206px] not-italic text-[#0b0b12] text-[17px] text-center top-[819px] w-[364px]">Next</p>
    </div>
  );
}