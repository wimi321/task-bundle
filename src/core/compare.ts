import path from "node:path";
import { BundleComparison } from "./schema";
import { inspectBundle } from "./bundle";

export async function compareBundles(leftDir: string, rightDir: string): Promise<BundleComparison> {
  const left = await inspectBundle(path.resolve(leftDir));
  const right = await inspectBundle(path.resolve(rightDir));

  return {
    left,
    right,
    sameTitle: left.title === right.title,
    sameRepo: left.repo === right.repo,
    sameCommit: left.commit === right.commit,
    artifactDelta: {
      onlyInLeft: left.artifacts.filter((artifact) => !right.artifacts.includes(artifact)),
      onlyInRight: right.artifacts.filter((artifact) => !left.artifacts.includes(artifact))
    },
    counts: {
      workspaceFilesDelta: left.workspaceFileCount - right.workspaceFileCount,
      eventCountDelta: left.eventCount - right.eventCount
    },
    modelChange: {
      left: left.model,
      right: right.model
    },
    toolChange: {
      left: left.tool,
      right: right.tool
    }
  };
}
