// Registry of 50 predefined boss appearances.
// Each entry maps to a visual definition: body, face, eyeWhite, pupil, accent colors
// plus eyeStyle, hornStyle, and markStyle feature flags.
const BOSS_VARIATIONS = {
  boss_variation_1:  { body:'#20150D', face:'#8A4530', eyeWhite:'#FFF5E8', pupil:'#20150D', accent:'#C98A38', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_2:  { body:'#20150D', face:'#8A4530', eyeWhite:'#FFF5E8', pupil:'#20150D', accent:'#C98A38', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_3:  { body:'#20150D', face:'#8A4530', eyeWhite:'#FFF5E8', pupil:'#20150D', accent:'#C98A38', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_4:  { body:'#20150D', face:'#8A4530', eyeWhite:'#FFF5E8', pupil:'#20150D', accent:'#C98A38', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_5:  { body:'#20150D', face:'#8A4530', eyeWhite:'#FFF5E8', pupil:'#20150D', accent:'#E8A840', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_6:  { body:'#0C1B2E', face:'#1E4D8C', eyeWhite:'#E8F5FF', pupil:'#0C1B2E', accent:'#4DD4F5', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_7:  { body:'#0C1B2E', face:'#1E4D8C', eyeWhite:'#E8F5FF', pupil:'#0C1B2E', accent:'#4DD4F5', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_8:  { body:'#0C1B2E', face:'#1E4D8C', eyeWhite:'#E8F5FF', pupil:'#0C1B2E', accent:'#4DD4F5', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_9:  { body:'#0C1B2E', face:'#1E4D8C', eyeWhite:'#E8F5FF', pupil:'#0C1B2E', accent:'#4DD4F5', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_10: { body:'#0C1B2E', face:'#1E4D8C', eyeWhite:'#E8F5FF', pupil:'#0C1B2E', accent:'#80EAFF', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_11: { body:'#1A0600', face:'#C43B0B', eyeWhite:'#FFE8D8', pupil:'#1A0600', accent:'#FFA020', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_12: { body:'#1A0600', face:'#C43B0B', eyeWhite:'#FFE8D8', pupil:'#1A0600', accent:'#FFA020', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_13: { body:'#1A0600', face:'#C43B0B', eyeWhite:'#FFE8D8', pupil:'#1A0600', accent:'#FFA020', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_14: { body:'#1A0600', face:'#C43B0B', eyeWhite:'#FFE8D8', pupil:'#1A0600', accent:'#FFA020', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_15: { body:'#1A0600', face:'#C43B0B', eyeWhite:'#FFE8D8', pupil:'#1A0600', accent:'#FFCC44', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_16: { body:'#091A0C', face:'#2E6B33', eyeWhite:'#E8FFE8', pupil:'#091A0C', accent:'#90EE60', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_17: { body:'#091A0C', face:'#2E6B33', eyeWhite:'#E8FFE8', pupil:'#091A0C', accent:'#90EE60', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_18: { body:'#091A0C', face:'#2E6B33', eyeWhite:'#E8FFE8', pupil:'#091A0C', accent:'#90EE60', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_19: { body:'#091A0C', face:'#2E6B33', eyeWhite:'#E8FFE8', pupil:'#091A0C', accent:'#90EE60', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_20: { body:'#091A0C', face:'#2E6B33', eyeWhite:'#E8FFE8', pupil:'#091A0C', accent:'#C8FF80', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_21: { body:'#120C1E', face:'#4A2080', eyeWhite:'#F0E8FF', pupil:'#120C1E', accent:'#C8A8FF', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_22: { body:'#120C1E', face:'#4A2080', eyeWhite:'#F0E8FF', pupil:'#120C1E', accent:'#C8A8FF', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_23: { body:'#120C1E', face:'#4A2080', eyeWhite:'#F0E8FF', pupil:'#120C1E', accent:'#C8A8FF', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_24: { body:'#120C1E', face:'#4A2080', eyeWhite:'#F0E8FF', pupil:'#120C1E', accent:'#C8A8FF', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_25: { body:'#120C1E', face:'#4A2080', eyeWhite:'#F0E8FF', pupil:'#120C1E', accent:'#E8D0FF', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_26: { body:'#1C1C1C', face:'#5A5A5A', eyeWhite:'#F0F0F0', pupil:'#1C1C1C', accent:'#D0D0D0', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_27: { body:'#1C1C1C', face:'#5A5A5A', eyeWhite:'#F0F0F0', pupil:'#1C1C1C', accent:'#D0D0D0', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_28: { body:'#1C1C1C', face:'#5A5A5A', eyeWhite:'#F0F0F0', pupil:'#1C1C1C', accent:'#D0D0D0', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_29: { body:'#1C1C1C', face:'#5A5A5A', eyeWhite:'#F0F0F0', pupil:'#1C1C1C', accent:'#D0D0D0', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_30: { body:'#1C1C1C', face:'#5A5A5A', eyeWhite:'#F0F0F0', pupil:'#1C1C1C', accent:'#FFFFFF', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_31: { body:'#061518', face:'#0B7A8A', eyeWhite:'#E0FFFF', pupil:'#061518', accent:'#40E8D8', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_32: { body:'#061518', face:'#0B7A8A', eyeWhite:'#E0FFFF', pupil:'#061518', accent:'#40E8D8', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_33: { body:'#061518', face:'#0B7A8A', eyeWhite:'#E0FFFF', pupil:'#061518', accent:'#40E8D8', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_34: { body:'#061518', face:'#0B7A8A', eyeWhite:'#E0FFFF', pupil:'#061518', accent:'#40E8D8', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_35: { body:'#061518', face:'#0B7A8A', eyeWhite:'#E0FFFF', pupil:'#061518', accent:'#80FFEC', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_36: { body:'#0F1605', face:'#456B15', eyeWhite:'#F0FFE0', pupil:'#0F1605', accent:'#B8FF40', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_37: { body:'#0F1605', face:'#456B15', eyeWhite:'#F0FFE0', pupil:'#0F1605', accent:'#B8FF40', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_38: { body:'#0F1605', face:'#456B15', eyeWhite:'#F0FFE0', pupil:'#0F1605', accent:'#B8FF40', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_39: { body:'#0F1605', face:'#456B15', eyeWhite:'#F0FFE0', pupil:'#0F1605', accent:'#B8FF40', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_40: { body:'#0F1605', face:'#456B15', eyeWhite:'#F0FFE0', pupil:'#0F1605', accent:'#DCFF70', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_41: { body:'#1C1206', face:'#96622A', eyeWhite:'#FFF8E0', pupil:'#1C1206', accent:'#E8C060', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_42: { body:'#1C1206', face:'#96622A', eyeWhite:'#FFF8E0', pupil:'#1C1206', accent:'#E8C060', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_43: { body:'#1C1206', face:'#96622A', eyeWhite:'#FFF8E0', pupil:'#1C1206', accent:'#E8C060', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_44: { body:'#1C1206', face:'#96622A', eyeWhite:'#FFF8E0', pupil:'#1C1206', accent:'#E8C060', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_45: { body:'#1C1206', face:'#96622A', eyeWhite:'#FFF8E0', pupil:'#1C1206', accent:'#FFDC88', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },

  boss_variation_46: { body:'#1A0205', face:'#8B1A1A', eyeWhite:'#FFE8E8', pupil:'#1A0205', accent:'#FF4060', eyeStyle:'normal', hornStyle:'square', markStyle:'none' },
  boss_variation_47: { body:'#1A0205', face:'#8B1A1A', eyeWhite:'#FFE8E8', pupil:'#1A0205', accent:'#FF4060', eyeStyle:'angry',  hornStyle:'tall',   markStyle:'scar' },
  boss_variation_48: { body:'#1A0205', face:'#8B1A1A', eyeWhite:'#FFE8E8', pupil:'#1A0205', accent:'#FF4060', eyeStyle:'wide',   hornStyle:'none',   markStyle:'stripe' },
  boss_variation_49: { body:'#1A0205', face:'#8B1A1A', eyeWhite:'#FFE8E8', pupil:'#1A0205', accent:'#FF4060', eyeStyle:'tiny',   hornStyle:'side',   markStyle:'spots' },
  boss_variation_50: { body:'#1A0205', face:'#8B1A1A', eyeWhite:'#FFE8E8', pupil:'#1A0205', accent:'#FF80A0', eyeStyle:'normal', hornStyle:'tall',   markStyle:'stripe' },
}

const DEFAULT_VARIATION = BOSS_VARIATIONS.boss_variation_1

function getVariation(variationId) {
  return BOSS_VARIATIONS[variationId] ?? DEFAULT_VARIATION
}

function renderEyes(v) {
  switch (v.eyeStyle) {
    case 'angry':
      return (
        <>
          <rect x="36" y="40" width="16" height="16" fill={v.eyeWhite} />
          <rect x="76" y="40" width="16" height="16" fill={v.eyeWhite} />
          <rect x="44" y="40" width="8" height="8" fill={v.pupil} />
          <rect x="76" y="40" width="8" height="8" fill={v.pupil} />
        </>
      )
    case 'wide':
      return (
        <>
          <rect x="34" y="38" width="20" height="18" fill={v.eyeWhite} />
          <rect x="74" y="38" width="20" height="18" fill={v.eyeWhite} />
          <rect x="42" y="46" width="12" height="10" fill={v.pupil} />
          <rect x="74" y="46" width="12" height="10" fill={v.pupil} />
        </>
      )
    case 'tiny':
      return (
        <>
          <rect x="39" y="44" width="10" height="10" fill={v.eyeWhite} />
          <rect x="79" y="44" width="10" height="10" fill={v.eyeWhite} />
          <rect x="45" y="50" width="4" height="4" fill={v.pupil} />
          <rect x="79" y="50" width="4" height="4" fill={v.pupil} />
        </>
      )
    default: // normal
      return (
        <>
          <rect x="36" y="40" width="16" height="16" fill={v.eyeWhite} />
          <rect x="76" y="40" width="16" height="16" fill={v.eyeWhite} />
          <rect x="44" y="48" width="8" height="8" fill={v.pupil} />
          <rect x="76" y="48" width="8" height="8" fill={v.pupil} />
        </>
      )
  }
}

function renderHorns(v) {
  switch (v.hornStyle) {
    case 'tall':
      return (
        <>
          <rect x="28" y="12" width="16" height="24" fill={v.accent} />
          <rect x="84" y="12" width="16" height="24" fill={v.accent} />
        </>
      )
    case 'side':
      return (
        <>
          <rect x="8" y="44" width="16" height="16" fill={v.accent} />
          <rect x="104" y="44" width="16" height="16" fill={v.accent} />
        </>
      )
    case 'none':
      return null
    default: // square
      return (
        <>
          <rect x="28" y="24" width="16" height="12" fill={v.accent} />
          <rect x="84" y="24" width="16" height="12" fill={v.accent} />
        </>
      )
  }
}

function renderMark(v) {
  switch (v.markStyle) {
    case 'scar':
      return <line x1="36" y1="36" x2="56" y2="62" stroke={v.eyeWhite} strokeWidth="3" opacity="0.8" />
    case 'stripe':
      return <rect x="28" y="62" width="72" height="8" fill={v.pupil} opacity="0.35" />
    case 'spots':
      return (
        <>
          <circle cx="38" cy="68" r="6" fill={v.eyeWhite} opacity="0.45" />
          <circle cx="90" cy="68" r="6" fill={v.eyeWhite} opacity="0.45" />
        </>
      )
    default:
      return null
  }
}

export default function BossAvatar({ size = 160, defeated = false, variationId }) {
  const v = getVariation(variationId)

  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Body shell */}
      <rect x="20" y="20" width="88" height="88" rx="12" fill={v.body} />
      {/* Face */}
      <rect x="28" y="28" width="72" height="72" rx="8" fill={v.face} />
      {/* Horns / side spikes */}
      {renderHorns(v)}
      {/* Eyes */}
      {renderEyes(v)}
      {/* Mouth */}
      <rect x="40" y="76" width="48" height="8" fill={v.pupil} />
      {/* Bottom trim / feet */}
      <rect x="52" y="92" width="24" height="12" fill={v.accent} />
      {/* Special mark */}
      {renderMark(v)}

      {defeated ? (
        <>
          <path d="M40 40L52 56M52 40L40 56M76 40L88 56M88 40L76 56" stroke={v.eyeWhite} strokeWidth="4" />
          <path d="M28 28L100 100" stroke={v.eyeWhite} strokeWidth="4" strokeDasharray="8 6" opacity="0.65" />
        </>
      ) : null}
    </svg>
  )
}