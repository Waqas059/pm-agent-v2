# Document extraction

The document library stores uploaded files in a private Supabase Storage bucket. The extraction endpoint reads that private object only after the authenticated user has passed the workspace-scoped document query.

Supported extraction formats:

- PDF, using `pdf-parse`
- DOCX, using `mammoth`
- Markdown, plain text, CSV, and JSON, using UTF-8 decoding

Legacy binary `.doc` files are intentionally rejected with an actionable
message; users should save them as `.docx` or PDF first. The extractor checks
the binary container signature as well as the filename and MIME type, so a
legacy `.doc` renamed to `.docx` is rejected safely instead of producing a
generic parser failure.

Each successful extraction stores normalized text and line locators containing the line number and exact start/end offsets. The workspace search endpoint searches extracted text alongside context, evidence, and artifacts. No AI provider is called during extraction.

The extraction table is tenant-scoped with authenticated workspace-member RLS. The client receives only extraction metadata after a successful run; extracted text remains behind the authenticated workspace search and database policies.
