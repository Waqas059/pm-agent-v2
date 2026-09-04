import "server-only";

import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

import {
  runStructuredWorkflow,
  type RunStructuredWorkflowRequest,
  type StructuredWorkflowResult,
} from "@/lib/openai/workflows";
import { validateStructuredWorkflowRequest } from "@/lib/openai/structured-output";

/**
 * Builds the shared LangChain Core pipeline used by PM workflows.
 *
 * LangChain owns orchestration here, while the final model invocation remains
 * the official OpenAI Responses API call. This keeps Responses-specific
 * structured output, store:false, and server-only credentials intact.
 */
export function createStructuredWorkflowChain<T>(
  executor: (request: RunStructuredWorkflowRequest<T>) => Promise<StructuredWorkflowResult<T>> = runStructuredWorkflow,
) {
  const validate = RunnableLambda.from((request: RunStructuredWorkflowRequest<T>) => {
    validateStructuredWorkflowRequest(request);
    return request;
  });

  const invoke = RunnableLambda.from((request: RunStructuredWorkflowRequest<T>) => executor(request));

  return RunnableSequence.from([validate, invoke]);
}

export async function runLangChainStructuredWorkflow<T>(
  request: RunStructuredWorkflowRequest<T>,
): Promise<StructuredWorkflowResult<T>> {
  return createStructuredWorkflowChain<T>().invoke(request);
}
