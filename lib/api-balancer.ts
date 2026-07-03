// lib/api-balancer.ts

/**
 * Executes a network fetch action using a rotating list of API keys.
 * If the API responds with a quota, rate limit, or auth error (401, 402, 403, 429),
 * it drops the dead key and automatically retries with the next one.
 * 
 * @param keysString A comma-separated string of API keys from process.env
 * @param action The fetch operation to perform with the active key
 */
export async function withKeyRotation<T>(
  keysString: string | undefined,
  action: (key: string) => Promise<T>,
  serviceName: string = 'External API'
): Promise<T> {
  if (!keysString || keysString.includes('your-')) {
    // If not set properly, just pass empty/dummy and let the downstream handle mock returns
    return action(keysString || '')
  }

  // Parse keys and clean up whitespace
  const keys = keysString.split(',').map(k => k.trim()).filter(Boolean)
  
  if (keys.length === 0) {
    return action('')
  }

  let lastError: any = null

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    try {
      return await action(key)
    } catch (error: any) {
      lastError = error
      
      // Extract status code from typical error messages thrown by our fetch wrappers
      // (e.g., "OpenRouter API error: 429" or "Embedding API error: 401")
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isExhaustionError = 
        errorMessage.includes('401') || // Unauthorized / Invalid Key
        errorMessage.includes('402') || // Payment Required
        errorMessage.includes('403') || // Forbidden / Out of credits
        errorMessage.includes('429')    // Too Many Requests / Rate Limited

      if (isExhaustionError) {
        console.warn(`[API Balancer] ${serviceName} key ${i + 1}/${keys.length} exhausted or rate-limited. Rotating to next key...`)
        continue // Try the next key in the loop
      }

      // If it's a 500 server error or a network failure, don't burn the next key, just throw.
      console.error(`[API Balancer] ${serviceName} returned a fatal non-quota error:`, errorMessage)
      throw error
    }
  }

  // If we exit the loop, every single key was exhausted.
  console.error(`[API Balancer] FATAL: All ${keys.length} keys for ${serviceName} have been exhausted!`)
  throw lastError
}
