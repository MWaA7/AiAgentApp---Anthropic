import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

import { tool } from "@langchain/core/tools";

const weatherTool = tool(
  async ({ query }) => {
    console.log("query", query);

    //TODO: implement this weather tool by fetching an API

    return "The weather in" + query + "is sunny";
  },
  {
    name: "weather",
    description: "Get the weather in a given location",
    schema: z.object({
      query: z.string().describe("The query to use in search"),
    }),
  }
);

const jsExecutor = tool(
  async ({ code }) => {
    const response = await fetch(process.env.EXECUTOR_URL || "", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ code }),
    });
    console.log(response);
    return await response.json();
  },
  {
    name: "run_javascript_code_tool",
    description: `
      Run general purpose javascript code.
      This can be used to access Internet or do any computation that you need.
      The output will be composed of the stdout and stderr.
      The code should be written in a way that it can be executed with javascript eval in node environment.
    `,
    schema: z.object({
      code: z.string().describe("The code to run"),
    }),
  }
);

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-latest",
});

const checkpointSaver = new MemorySaver();

export const agent = createReactAgent({
  llm: model, // large language model
  tools: [weatherTool, jsExecutor], // tools to use
  checkpointSaver,
});
