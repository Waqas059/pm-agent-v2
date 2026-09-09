import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchGitHubRepositoryPreview, parseGitHubRepositoryUrl } from "./github";

describe("GitHub read-only integration", () => {
  it("accepts only a public repository URL and normalizes .git suffixes", () => {
    expect(parseGitHubRepositoryUrl("https://www.github.com/acme/product.git")).toEqual({
      owner: "acme",
      name: "product",
      url: "https://github.com/acme/product",
    });
  });

  it("rejects non-GitHub hosts and nested paths", () => {
    expect(() => parseGitHubRepositoryUrl("https://gitlab.com/acme/product")).toThrow("Only public repositories");
    expect(() => parseGitHubRepositoryUrl("https://github.com/acme/product/issues")).toThrow("Use a repository URL");
  });

  it("returns metadata and a bounded issue preview without repository content", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/issues?state=open&per_page=5")) {
        return new Response(JSON.stringify([{ title: "Improve setup", html_url: "https://github.com/acme/product/issues/1", updated_at: "2026-09-08T00:00:00Z", labels: [{ name: "product" }], body: "private issue body should not be returned" }]), { status: 200 });
      }
      return new Response(JSON.stringify({ full_name: "acme/product", html_url: "https://github.com/acme/product", description: "A product repository", default_branch: "main", stargazers_count: 12, private: false }), { status: 200 });
    });

    const preview = await fetchGitHubRepositoryPreview("https://github.com/acme/product");
    expect(preview).toMatchObject({ fullName: "acme/product", defaultBranch: "main", visibility: "public", stars: 12 });
    expect(preview.openIssues).toEqual([{ title: "Improve setup", url: "https://github.com/acme/product/issues/1", updatedAt: "2026-09-08T00:00:00Z", labels: ["product"] }]);
    expect(JSON.stringify(preview)).not.toContain("private issue body");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });
});
