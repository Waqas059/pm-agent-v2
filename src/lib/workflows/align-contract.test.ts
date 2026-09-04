import { describe, expect, it } from "vitest";
import { buildAlignInput, createAlignOutputParser, type AlignOutput } from "./align-contract";

const citationKey = "CIT-TEST1234";
function validOutput(): AlignOutput { return { title: "Setup flow update", format: "executive_update", audience: "Product leadership", message: "We are evaluating a shorter setup flow based on one cited UAT observation.", keyPoints: [{ title: "Faster setup is a stated need", detail: "The supplied evidence asks for fewer setup steps.", citationKeys: [citationKey] }], decisionsOrAsks: ["Confirm the baseline setup flow before changing it."], caveats: [{ title: "Evidence is limited", detail: "The sample does not establish a production-wide trend.", citationKeys: [citationKey] }], openQuestions: ["Which step causes the most friction?"], limitations: ["Only one citation-backed observation is available."] }; }

describe("align contract", () => {
  it("accepts a citation-anchored communication", () => { expect(createAlignOutputParser(new Set([citationKey]))(validOutput())).toMatchObject({ format: "executive_update" }); });
  it("rejects unknown citations", () => { const output = validOutput(); output.keyPoints[0].citationKeys = ["CIT-UNKNOWN"]; expect(() => createAlignOutputParser(new Set([citationKey]))(output)).toThrow(/unknown citation key/); });
  it("serializes the requested format and source blocks", () => { const input = buildAlignInput({ format: "engineering_brief", request: "Explain the proposal to engineering.", contextItems: [], evidenceItems: [{ kind: "quote", title: "Setup feedback", content: "Fewer steps are preferred.", source_label: "UAT", citationKey }] }); expect(input).toContain("Engineering brief"); expect(input).toContain("<citation_backed_evidence>"); expect(input).toContain(citationKey); });
});
