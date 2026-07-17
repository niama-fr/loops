import { describe, expect, test } from "bun:test";
import { ConvexError } from "convex/values";
import { loopsFetch, sanitizeLoopsError } from "../../src/component/helpers";

type FailureData = { code: string; failure: string };

describe("Loops request failures", () => {
	test("exposes only the stable failure classification", () => {
		const error = sanitizeLoopsError(429, "Rate limited");

		expect(error).toBeInstanceOf(ConvexError);
		expect((error as ConvexError<FailureData>).data).toEqual({
			code: "LOOPS_REQUEST_FAILED",
			failure: "rateLimited",
		});
	});

	test("classifies network errors without exposing transport details", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = Object.assign(
			() => Promise.reject(new Error("socket details")),
			{ preconnect: originalFetch.preconnect },
		);

		try {
			await loopsFetch("api-key", "/contacts");
			expect.unreachable("Expected the request to fail");
		} catch (error) {
			expect((error as ConvexError<FailureData>).data).toEqual({
				code: "LOOPS_REQUEST_FAILED",
				failure: "network",
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
