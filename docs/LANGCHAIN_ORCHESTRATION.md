# LangChain orchestration

PM Agent V2 uses LangChain Core as a small, explicit orchestration layer for the three connected PM workflows:

`Discover & synthesize → Define & specify → Align & communicate`

Each workflow passes its typed request through the shared `RunnableSequence` in `src/lib/langchain/structured-workflow.ts`. The sequence validates the request boundary first, then invokes the workflow executor.

The executor remains the server-only OpenAI Responses API implementation in `src/lib/openai/workflows.ts`. This preserves strict JSON Schema output, `store: false`, configurable model selection, runtime output validation, and the existing server-side credential boundary.

This is deliberate orchestration rather than a collection of independent agents. The product specification prioritizes one connected context-first workflow over ten disconnected agent classes.
