import path from "node:path";
import { inspectBundle } from "./bundle";
import { ArtifactInfo, BundleComparison } from "./schema";

export async function compareBundles(leftDir: string, rightDir: string): Promise<BundleComparison> {
  const left = await inspectBundle(path.resolve(leftDir));
  const right = await inspectBundle(path.resolve(rightDir));
  const leftArtifactKeys = Object.keys(left.artifactInfo);
  const rightArtifactKeys = Object.keys(right.artifactInfo);
  const sharedArtifactKeys = [...new Set([...leftArtifactKeys, ...rightArtifactKeys])].sort();

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
    artifactChanges: sharedArtifactKeys.map((artifact) => {
      const leftArtifact = left.artifactInfo[artifact];
      const rightArtifact = right.artifactInfo[artifact];

      return {
        artifact,
        left: leftArtifact,
        right: rightArtifact,
        sameHash: compareArtifactField(leftArtifact, rightArtifact, "sha256"),
        sameSize: compareArtifactField(leftArtifact, rightArtifact, "size")
      };
    }),
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
    },
    outcomeChange: {
      leftStatus: left.outcome?.status,
      rightStatus: right.outcome?.status,
      leftScore: left.outcome?.score,
      rightScore: right.outcome?.score,
      scoreDelta:
        left.outcome?.score !== undefined && right.outcome?.score !== undefined
          ? left.outcome.score - right.outcome.score
          : undefined
    }
  };
}

function compareArtifactField(
  left: ArtifactInfo | undefined,
  right: ArtifactInfo | undefined,
  field: "sha256" | "size"
): boolean {
  if (!left || !right) {
    return false;
  }

  return left[field] === right[field];
}
