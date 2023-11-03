import { graphlib, layout } from "@dagrejs/dagre";
import { Issue, IssueLink } from "../types";

const options = {
  directed: true,
  multigraph: false,
  compound: false,
};

const nodeShape = { width: 500, height: 150 };

export const graphLayout = (issues: Issue[], links: IssueLink[]) => {
  const data = {
    options,
    nodes: [{ key: "root" }, ...issues].map(({ key }) => ({
      v: key,
      value: { label: "" },
      ...nodeShape,
    })),
    edges: [
      ...links.map(({ linkType, inwardIssue, outwardIssue }) => ({
        v: inwardIssue,
        w: outwardIssue,
        value: { label: linkType },
      })),
      ...issues.map(({ key }) => ({
        v: "root",
        w: key,
        value: { label: "root" },
      })),
    ],
  };

  const graph = graphlib.json.read(data);
  graph.setGraph({
    nodesep: 200,
    ranksep: 80
  });
  layout(graph);

  return graph;
};

