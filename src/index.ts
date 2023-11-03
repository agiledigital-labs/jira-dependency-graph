import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";
import { sequenceAsync } from "./async";
const resolver = new Resolver();

type IssueStub = {
  key: string;
};
type Issue = {
  key: string;
  summary: string;
  status: {
    name: string;
    statusCategory: {
      id: number;
      key: string;
      colorName: string;
      name: string;
    };
  };
  issuelinks: {
    id: string;
    type: {
      name: string;
    };
    inwardIssue?: IssueStub;
    outwardIssue?: IssueStub;
  }[];
};

resolver.define("fetchSubtasks", async (req) => {
  const parentKey = req.context.extension.issue.key;

  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${parentKey}?fields=subtasks`);

  const data = await res.json();

  const subtaskStubs: IssueStub[] = data.fields.subtasks;

  const subtasks = await sequenceAsync(subtaskStubs, async ({ key }) => {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${key}?fields=issuelinks,summary,status`
      );

    const data = await res.json();
    return { ...data.fields, key: data.key } as Issue;
  });

  return {
    subtasks: subtasks.map((s) => ({
      key: s.key,
      summary: s.summary,
      status: s.status.name,
      statusCategory: s.status.statusCategory.key,
    })),
    links: subtasks
      .map((s) =>
        s.issuelinks
          .filter((l) => l.outwardIssue !== undefined)
          .map((l) => ({
            id: l.id,
            inwardIssue: s.key,
            outwardIssue: l.outwardIssue?.key,
            linkType: l.type.name,
          }))
      )
      .reduce((a, b) => [...a, ...b], []),
  };
});

resolver.define("addLink", async (req) => {
  const body = {
    inwardIssue: {
      key: req.payload.inwardIssue,
    },
    outwardIssue: {
      key: req.payload.outwardIssue,
    },
    type: {
      name: req.payload.linkType,
    },
  };
  const res = await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return res;
});

resolver.define("removeLinkById", async (req) => {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issueLink/${req.payload.id}`, {
      method: "DELETE",
    });

  return res;
});

resolver.define("removeMatchingLink", async (req) => {
  console.log("removing matching link: ", JSON.stringify(req.payload));

  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/issue/${req.payload.inwardIssue}?fields=issuelinks`
    );

  const data = await res.json();
  const issue = data.fields as Issue;
  console.log("existing links: ", JSON.stringify(issue.issuelinks));
  const matchingLink = issue.issuelinks.find(
    (l) =>
      l.outwardIssue?.key === req.payload.outwardIssue &&
      l.type.name === req.payload.linkType
  );

  if (matchingLink !== undefined) {
    return api
      .asUser()
      .requestJira(route`/rest/api/3/issueLink/${matchingLink.id}`, {
        method: "DELETE",
      });
  } else {
    console.error("NO MATCH FOUND");
  }
});
export const handler = resolver.getDefinitions();
