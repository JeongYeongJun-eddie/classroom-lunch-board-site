import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function getStudentNames(appJs) {
  const match = appJs.match(/const STUDENTS = \[(?<body>[\s\S]*?)\];/);
  assert.ok(match?.groups?.body, "STUDENTS roster should be declared");

  return [...match.groups.body.matchAll(/"([^"]+)"/g)].map(
    ([, name]) => name,
  );
}

test("server-renders the classroom lunch board", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>오늘 뭐 먹었나요\?<\/title>/i);
  assert.match(html, /src="\/classroom-lunch-board\/index\.html"/);
  assert.doesNotMatch(html, /codex-preview|Building your site/i);
});

test("includes 이서현 without shifting existing student ids", async () => {
  const appJs = await readFile(
    new URL("../public/classroom-lunch-board/app.js", import.meta.url),
    "utf8",
  );

  const previousRoster = [
    "박수연",
    "여혜인",
    "이채원",
    "김은혜",
    "성민규",
    "백민하",
    "서현진",
    "조수권",
    "한보영",
    "정다교",
    "정영준",
    "최윤하",
    "이찬종",
    "김다윤",
    "박유진",
    "김수아",
    "조은지",
    "최종관",
    "하창빈",
    "성루비",
    "김초현",
    "최낙준",
    "박신영",
    "한수아",
    "이재윤",
    "박은비",
    "윤성혁",
    "박소정",
    "최예성",
  ];
  const currentRoster = getStudentNames(appJs);

  assert.deepEqual(currentRoster.slice(0, previousRoster.length), previousRoster);
  assert.equal(currentRoster.at(-1), "이서현");
  assert.equal(new Set(currentRoster).size, currentRoster.length);
  assert.match(appJs, /studentCount\.textContent = String\(STUDENTS\.length\)/);
  assert.match(appJs, /shuffle\(STUDENTS\)/);
  assert.match(appJs, /const SEAT_COUNT = 32;/);
});
