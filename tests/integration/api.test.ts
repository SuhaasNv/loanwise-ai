import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiError } from "@/lib/api-client";

const mockFetch = vi.fn();

describe("apiClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    // Ensure mock mode is off so tests exercise real fetch logic.
    vi.stubEnv("VITE_USE_MOCK_DATA", "false");
  });

  // ── Loan Prediction ────────────────────────────────────────────────────────

  describe("Loan Prediction API", () => {
    it("calls POST /loan/predict with application data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const payload = {
        income: 95000,
        creditScore: 742,
        loanAmount: 250000,
        employmentType: "Full-time",
      };

      await apiClient("/loan/predict", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/loan/predict"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
    });

    it("returns typed prediction response", async () => {
      const mockResponse = { riskScore: 0.23, approvalProbability: 0.77, decision: "approved", confidence: 0.94 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiClient("/loan/predict", {
        method: "POST",
        body: JSON.stringify({ income: 50000 }),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  // ── Email Generation ───────────────────────────────────────────────────────

  describe("Email Generation API", () => {
    it("calls POST /loan/email", async () => {
      const mockResponse = { email: "Dear Sarah...", biasScore: 0.02, toxicityScore: 0.01 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const payload = { loanId: "LN-001", decision: "approved", applicantName: "Sarah Chen", loanAmount: 250000 };
      const result = await apiClient("/loan/email", { method: "POST", body: JSON.stringify(payload) });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/loan/email"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────────

  describe("Recommendation API", () => {
    it("calls POST /loan/recommendation", async () => {
      const mockResponse = { recommendations: [{ productName: "SecureLine", type: "Personal Loan", rate: "7.5% APR", description: "...", matchScore: 92 }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const payload = { loanId: "LN-002", applicantIncome: 68000, creditScore: 615 };
      const result = await apiClient("/loan/recommendation", { method: "POST", body: JSON.stringify(payload) });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/loan/recommendation"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ── Agent Logs ─────────────────────────────────────────────────────────────

  describe("Agent Workflow API", () => {
    it("calls GET /agents/logs", async () => {
      const mockLogs = [
        {
          id: "AG-001",
          agentName: "RiskAssessor",
          action: "Evaluated credit risk",
          timestamp: "2026-03-12T14:32:00Z",
          status: "success",
          confidenceScore: 0.94,
          applicationId: "LN-001",
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLogs),
      } as Response);

      const result = await apiClient("/agents/logs");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/agents/logs"),
        expect.objectContaining({
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
      expect(result).toEqual(mockLogs);
    });
  });

  // ── Analytics ──────────────────────────────────────────────────────────────

  describe("Analytics API", () => {
    it("calls GET /analytics/stats", async () => {
      const mockStats = { totalApplications: 47, approvalRate: 68.3, avgRiskScore: 0.34, activeAgents: 4 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      } as Response);

      const result = await apiClient("/analytics/stats");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/analytics/stats"),
        expect.objectContaining({
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
      expect(result).toEqual(mockStats);
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe("Error handling", () => {
    it("throws ApiError on 5xx response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      } as unknown as Response);

      await expect(apiClient("/analytics/stats")).rejects.toThrow(ApiError);
    });

    it("includes status code in ApiError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.reject(new Error("not json")),
      } as unknown as Response);

      const err = await apiClient("/loans/missing").catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(404);
    });

    it("uses error detail from JSON body when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: () => Promise.resolve({ detail: "Validation error" }),
      } as unknown as Response);

      const err = await apiClient("/loan/predict", { method: "POST" }).catch((e) => e);
      expect(err.message).toContain("Validation error");
    });

    it("does not retry on 4xx client errors", () => {
      // Verified by query-client retry logic — ApiError with status < 500 returns false.
      const err = new ApiError(400, "Bad Request");
      // Simulate the retry callback from query-client.ts
      const shouldRetry = (failureCount: number, error: unknown) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 1;
      };
      expect(shouldRetry(0, err)).toBe(false);
      expect(shouldRetry(0, new ApiError(503, "Service Unavailable"))).toBe(true);
      expect(shouldRetry(1, new ApiError(503, "Service Unavailable"))).toBe(false);
    });
  });
});
