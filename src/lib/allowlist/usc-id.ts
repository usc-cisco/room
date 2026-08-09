/** The only domain a USC id can be read out of. */
export const USC_DOMAIN = "usc.edu.ph"

/**
 * The USC id in a school address, or null for anything else.
 *
 * The domain check is the whole point. Any Google account can reach the
 * sign-in, and `24100907@gmail.com` is a registerable address — matching on the
 * local part alone would hand it a row meant for `24100907@usc.edu.ph`. An
 * exact domain match, not a suffix one: `usc.edu.ph.example.com` ends with the
 * domain and `mail.usc.edu.ph` contains it, and neither is ours.
 */
export function uscIdFromEmail(email: string): string | null {
  const address = email.trim().toLowerCase()

  // An address may only carry one `@`; more than one is malformed, not a
  // local part that happens to contain the character.
  const at = address.indexOf("@")
  if (at === -1 || at !== address.lastIndexOf("@")) return null

  const local = address.slice(0, at)
  const domain = address.slice(at + 1)

  if (!local || domain !== USC_DOMAIN) return null

  return local
}
