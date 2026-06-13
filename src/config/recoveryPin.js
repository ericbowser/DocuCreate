export const RECOVERY_PIN_MIN_LENGTH = 4
export const RECOVERY_PIN_MAX_LENGTH = 20

/** @returns {string|null} Error message or null if valid */
export function validateRecoveryPin(pin) {
  if (!pin || pin.length < RECOVERY_PIN_MIN_LENGTH) {
    return `PIN must be at least ${RECOVERY_PIN_MIN_LENGTH} characters.`
  }
  if (pin.length > RECOVERY_PIN_MAX_LENGTH) {
    return `PIN must be at most ${RECOVERY_PIN_MAX_LENGTH} characters.`
  }
  return null
}
