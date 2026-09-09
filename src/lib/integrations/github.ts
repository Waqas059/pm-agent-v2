import "server-only";

export type GitHubIssuePreview = {
  title: string;
  url: string;
  updatedAt: string;
  labels: string[];
};

export type GitHubRepositoryPreview = {
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  visibility: "public";
  stars: number;
  openIssues: GitHubIssuePreview[];
  retrievedAt: string;
  limitations: string[];
};

type GitHubRepositoryRef = { owner: string; name: string; url: string };

function isValidSegment(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value) && value.length <= 100;
}

export function parseGitHubRepositoryUrl(value: string): GitHubRepositoryRef {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500) throw new Error("Enter a GitHub repository URL of 500 characters or fewer.");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid public GitHub repository URL.");
  }

  if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("Only public repositories on github.com are supported.");
  }

  let segments: string[];
  try {
    segments = url.pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    throw new Error("Enter a valid public GitHub repository URL.");
  }
  if (segments.length !== 2) throw new Error("Use a repository URL such as https://github.com/owner/repository.");
  const owner = segments[0];
  const name = segments[1].replace(/\.git$/i, "");
  if (!isValidSegment(owner) || !isValidSegment(name)) throw new Error("That GitHub repository URL contains an invalid owner or repository name.");

  return { owner, name, url: `https://github.com/${owner}/${name}` };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("GitHub returned an invalid repository response.");
  return value as Record<string, unknown>;
}

async function githubJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "bootstrap-pm-agent" },
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) throw new Error("That repository was not found or is not public.");
  if (!response.ok) throw new Error(`GitHub could not be reached (status: ${response.status}).`);
  return response.json() as Promise<unknown>;
}

export async function fetchGitHubRepositoryPreview(repositoryUrl: string): Promise<GitHubRepositoryPreview> {
  const reference = parseGitHubRepositoryUrl(repositoryUrl);
  const [repositoryValue, issuesValue] = await Promise.all([
    githubJson(`https://api.github.com/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.name)}`),
    githubJson(`https://api.github.com/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.name)}/issues?state=open&per_page=5`),
  ]);
  const repository = asRecord(repositoryValue);
  const issues = Array.isArray(issuesValue) ? issuesValue : [];
  const fullName = repository.full_name;
  const defaultBranch = repository.default_branch;
  const htmlUrl = repository.html_url;
  const stars = repository.stargazers_count;
  if (typeof fullName !== "string" || typeof defaultBranch !== "string" || typeof htmlUrl !== "string" || typeof stars !== "number") {
    throw new Error("GitHub returned incomplete repository metadata.");
  }

  const openIssues = issues.flatMap((value): GitHubIssuePreview[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const issue = value as Record<string, unknown>;
    if (typeof issue.title !== "string" || typeof issue.html_url !== "string" || typeof issue.updated_at !== "string") return [];
    const labels = Array.isArray(issue.labels) ? issue.labels.flatMap((label) => {
      if (!label || typeof label !== "object" || Array.isArray(label)) return [];
      const name = (label as Record<string, unknown>).name;
      return typeof name === "string" ? [name] : [];
    }) : [];
    return [{ title: issue.title, url: issue.html_url, updatedAt: issue.updated_at, labels }];
  });

  return {
    fullName,
    url: htmlUrl,
    description: typeof repository.description === "string" ? repository.description : null,
    defaultBranch,
    visibility: "public",
    stars,
    openIssues,
    retrievedAt: new Date().toISOString(),
    limitations: [
      "This preview reads public repository metadata and the five most recently updated open issues only.",
      "Nothing is saved to the workspace and no GitHub write action is available.",
      "Private repositories and authenticated organization context require an explicit OAuth integration decision.",
    ],
  };
}
