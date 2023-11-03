import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { invoke } from "@forge/bridge";
import ReactFlow, {
  Connection,
  Controls,
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
} from "reactflow";

import "reactflow/dist/style.css";
import { graphLayout } from "./services/layout";
import { Issue, IssueLink } from "./types";
import { useMutation, useQuery } from "react-query";

const linkType = "Blocks";
const fetchSubtasks = async () => {
  const result = await invoke("fetchSubtasks");
  return result as {
    subtasks: Issue[];
    links: IssueLink[];
  };
};

const handleAddLink = async (link: Omit<IssueLink, "id">) => {
  const res = await invoke("addLink", link);
  console.error(res);
  return res;
};

const handleRemoveLink = async (link: IssueLink) => {
  if (link.id === undefined || link.id.startsWith("created")) {
    return invoke("removeMatchingLink", link);
  } else {
    return invoke("removeLinkById", { id: link.id });
  }
};

const IssueNode: FunctionComponent<NodeProps<Issue>> = ({ data }) => (
  <>
    <Handle type="target" position={Position.Top} />
    <div style={{ textAlign: "left" }}>
      <a href={`/browse/${data.key}`}>{data.key}</a> <span>{data.summary}</span>{" "}
      <div className={`status-banner ${data.statusCategory}`}>{data.status}</div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </>
);

const nodeTypes = { default: IssueNode };

function App() {
  const preserveUpdatedEdge = useRef(false);
  const [subtasks, setSubtasks] = useState<Issue[]>([]);
  const [links, setLinks] = useState<IssueLink[]>([]);
  const [nodes, setNodes] = useState<Node<Issue>[]>([]);
  const [edges, setEdges] = useState<Edge<IssueLink>[]>([]);

  const query = useQuery("subtasks", fetchSubtasks, {
    refetchOnWindowFocus: false,
  });
  const addLink = useMutation(handleAddLink);
  const removeLink = useMutation(handleRemoveLink);
  // useEffect(() => {
  //   const subscription = events.on("JIRA_ISSUE_CHANGED", () => query.refetch());

  //   return () => {
  //     subscription.then((subscription) => subscription.unsubscribe());
  //   };
  // }, [query]);

  useEffect(() => {
    if (query.data) {
      setSubtasks(query.data.subtasks);
      setLinks(query.data.links);
    }
  }, [query.data]);

  useEffect(() => {
    if (subtasks !== undefined) {
      const graph = graphLayout(subtasks, links);

      setNodes(
        subtasks.map((subtask) => {
          const node = graph.node(subtask.key);
          return {
            id: subtask.key,
            position: { x: node.x, y: node.y },
            data: subtask,
          };
        })
      );

      setEdges(
        links.map((link) => ({
          id: link.id ?? `created-${link.inwardIssue}-${link.outwardIssue}`,
          source: link.inwardIssue,
          target: link.outwardIssue,
          data: link,
        }))
      );
    }
  }, [subtasks, links]);

  const onConnect = (connection: Connection) => {
    console.warn(`Connection  made: ${JSON.stringify(connection)}`);
    const newLink = {
      linkType,
      inwardIssue: connection.source ?? "",
      outwardIssue: connection.target ?? "",
    };
    //TODO - call our backend to create a new relationship
    setLinks((links) => [...links, newLink]);
    addLink.mutate(newLink);
  };

  const onEdgeUpdateStart = useCallback(() => {
    preserveUpdatedEdge.current = false;
  }, []);

  const onEdgeUpdateEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!preserveUpdatedEdge.current) {
        setLinks((links) =>
          links.filter(
            (l) =>
              l.inwardIssue !== edge.source || l.outwardIssue !== edge.target
          )
        );
        removeLink.mutate({
          id: edge.id,
          inwardIssue: edge.source,
          outwardIssue: edge.target,
          linkType,
        });
      }
    },
    [removeLink]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (
        oldEdge.source == newConnection.source &&
        oldEdge.target == newConnection.target
      ) {
        preserveUpdatedEdge.current = true;
      } else {
        const newLink = {
          linkType,
          inwardIssue: newConnection.source ?? "",
          outwardIssue: newConnection.target ?? "",
        };
        setLinks((links) => [
          ...links,
          {
            id: "",
            ...newLink,
          },
        ]);
        addLink.mutate(newLink);
      }
    },
    [addLink]
  );

  if (query.isLoading || query.isRefetching) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        nodeTypes={nodeTypes}
        fitView
      >
        <div
          className="react-flow__panel react-flow__controls top right"
          style={{ pointerEvents: "all" }}
          data-testid="rf__controls"
        >
          <button
            type="button"
            aria-label="zoom in"
            onClick={() => query.refetch()}
          >
            Refresh
          </button>
        </div>
        <Controls />
      </ReactFlow>
    </>
  );
}

export default App;
