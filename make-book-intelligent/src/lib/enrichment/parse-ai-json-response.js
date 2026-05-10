export function parseAiJsonResponse(result) {
	const payload = result?.response ?? result;

	if (typeof payload === 'string') {
		return JSON.parse(payload);
	}

	if (payload && typeof payload === 'object') {
		return payload;
	}

	throw new TypeError(`Unsupported AI response payload type: ${typeof payload}`);
}