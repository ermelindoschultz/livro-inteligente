export default function BossAvatar({ size = 160, defeated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="20" width="88" height="88" rx="12" fill="#20150D" />
      <rect x="28" y="28" width="72" height="72" rx="8" fill="#8A4530" />
      <path d="M36 40H52V56H36V40ZM76 40H92V56H76V40Z" fill="#FFF5E8" />
      <path d="M44 48H52V56H44V48ZM76 48H84V56H76V48Z" fill="#20150D" />
      <path d="M40 76H88V84H40V76Z" fill="#20150D" />
      <path d="M28 24H44V36H28V24ZM84 24H100V36H84V24Z" fill="#C98A38" />
      <path d="M52 92H76V104H52V92Z" fill="#C98A38" />

      {defeated ? (
        <>
          <path d="M40 40L52 56M52 40L40 56M76 40L88 56M88 40L76 56" stroke="#FFF5E8" strokeWidth="4" />
          <path d="M28 28L100 100" stroke="#FFF5E8" strokeWidth="4" strokeDasharray="8 6" opacity="0.65" />
        </>
      ) : null}
    </svg>
  )
}