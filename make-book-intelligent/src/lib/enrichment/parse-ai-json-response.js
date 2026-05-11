export function parseAiJsonResponse(result) {
	let payload = result?.response ?? result;
	
	if (payload && typeof payload === 'object') {
		return payload;
	}

	if (typeof payload === 'string') {
		// Try to extract JSON from markdown code blocks
		const jsonMatch = payload.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (jsonMatch) {
			payload = jsonMatch[1].trim();
		}

		// First, try parsing as-is
		try {
			return JSON.parse(payload);
		} catch {
			// If that fails, try to extract JSON
		}

		// Try to find the first { and last } to isolate JSON
		const jsonStart = payload.indexOf('{');
		const jsonEnd = payload.lastIndexOf('}');
		
		if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
			const extracted = payload.substring(jsonStart, jsonEnd + 1);
			try {
				return JSON.parse(extracted);
			} catch {
				// Continue to final parse attempt
			}
		}

		// Final attempt - let JSON.parse handle it with proper error
		try {
			return JSON.parse(payload);
		} catch (error) {
			// Enhanced error reporting with context
			const snippet = payload.substring(Math.max(0, error.position - 50), Math.min(payload.length, error.position + 50));
			const errorMsg = `Failed to parse AI JSON response: ${error.message}\n` +
				`Context around error: ...${snippet}...\n` +
				`Full response length: ${payload.length} characters\n` +
				`Complete response snippet: ${payload}`;
			
			const parseError = new Error(errorMsg);
			parseError.originalError = error;
			parseError.payload = payload;
			throw parseError;
		}
	}

	throw new TypeError(`Unsupported AI response payload type: ${typeof payload}`);
}