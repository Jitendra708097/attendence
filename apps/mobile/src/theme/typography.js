/**
 * @module typography
 * @description Font scale, weights, and line heights for AttendEase.
 *              Outfit  → all UI text (clean, modern, warm)
 *              DM Mono → times, durations, data values (precise)
 */

export const typography = {
  // ─── Font Families ──────────────────────────────────────────────────────────
  fontRegular:  'Outfit_400Regular',
  fontMedium:   'Outfit_500Medium',
  fontSemiBold: 'Outfit_600SemiBold',
  fontBold:     'Outfit_700Bold',
  fontMono:     'DMMono_400Regular',
  fontMonoMed:  'DMMono_500Medium',

  // ─── Font Sizes ─────────────────────────────────────────────────────────────
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,

  // ─── Line Heights ───────────────────────────────────────────────────────────
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.75,
};
