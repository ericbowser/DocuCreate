/** When true, document API routes accept any request that knows a valid document ID (no access token). */
export function isDocumentIdOnlyAccess() {
  return process.env.DOCUMENT_ID_ACCESS === 'true'
}

export function isRecoveryPasswordEnabled() {
  return !isDocumentIdOnlyAccess()
}
