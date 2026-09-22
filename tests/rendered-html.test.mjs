import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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

function getStudentSlots(appJs) {
  const match = appJs.match(/const STUDENTS = \[(?<body>[\s\S]*?)\];/);
  assert.ok(match?.groups?.body, "STUDENTS roster should be declared");

  return match.groups.body
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => (entry === "null" ? null : entry.replace(/^"|"$/g, "")));
}

function runAppJsForTest(appJs, extraScript) {
  class MockElement {
    constructor() {
      this.classList = {
        add() {},
        remove() {},
        toggle() {},
      };
      this.dataset = {};
      this.style = {
        setProperty() {},
      };
    }

    addEventListener() {}
    append() {}
    close() {}
    contains() {
      return false;
    }
    focus() {}
    setAttribute() {}
    showModal() {}
  }

  const context = {
    document: {
      createElement: () => new MockElement(),
      querySelector: () => new MockElement(),
      querySelectorAll: () => [],
      addEventListener() {},
    },
    localStorage: {
      getItem: () => null,
      removeItem() {},
      setItem() {},
    },
    setTimeout,
  };

  vm.runInNewContext(`${appJs}\n${extraScript}`, context);
  return context;
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

test("includes 이서현 and blanks 박유진's slot without shifting existing student ids", async () => {
  const appJs = await readFile(
    new URL("../public/classroom-lunch-board/app.js", import.meta.url),
    "utf8",
  );

  const previousSlots = [
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
    null,
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
  const currentSlots = getStudentSlots(appJs);

  assert.deepEqual(currentSlots.slice(0, previousSlots.length), previousSlots);
  assert.equal(currentSlots.at(-1), "이서현");
  assert.ok(!currentSlots.includes("박유진"), "박유진 should no longer appear");

  const activeNames = currentSlots.filter(Boolean);
  assert.equal(new Set(activeNames).size, activeNames.length);
  assert.match(
    appJs,
    /studentCount\.textContent = String\(STUDENTS\.filter\(Boolean\)\.length\)/,
  );
  assert.match(appJs, /createLunchGroups\(attendingNames\)/);
  assert.match(appJs, /const SEAT_COUNT = 32;/);
});

test("excludes marked absentees from lunch groups and keeps every group at 3-4 students", async () => {
  const appJs = await readFile(
    new URL("../public/classroom-lunch-board/app.js", import.meta.url),
    "utf8",
  );
  const context = runAppJsForTest(
    appJs,
    `
      state.absentIds = new Set(["student-1", "student-2", "student-3"]);
      globalThis.__attendingNames = getAttendingStudentNames();
      globalThis.__groupSizes = createLunchGroups(getAttendingStudentNames()).map(
        (group) => group.length,
      );
    `,
  );

  assert.equal(context.__attendingNames.length, 26);
  assert.ok(!context.__attendingNames.includes("박수연"));
  assert.ok(!context.__attendingNames.includes("여혜인"));
  assert.ok(!context.__attendingNames.includes("이채원"));

  const groupSizes = JSON.parse(JSON.stringify(context.__groupSizes));
  assert.deepEqual(groupSizes, [4, 4, 4, 4, 4, 3, 3]);
  groupSizes.forEach((size) => {
    assert.ok(size >= 3 && size <= 4, `group size ${size} should be 3 or 4`);
  });
});

test("makes 29 active students into five groups of 4 and three groups of 3", async () => {
  const appJs = await readFile(
    new URL("../public/classroom-lunch-board/app.js", import.meta.url),
    "utf8",
  );
  const context = runAppJsForTest(
    appJs,
    "globalThis.__groupSizes = createLunchGroups(STUDENTS.filter(Boolean)).map((group) => group.length);",
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.__groupSizes)),
    [4, 4, 4, 4, 4, 3, 3, 3],
  );
});

test("keeps every lunch group at 3 or more students when possible", async () => {
  const appJs = await readFile(
    new URL("../public/classroom-lunch-board/app.js", import.meta.url),
    "utf8",
  );
  const context = runAppJsForTest(
    appJs,
    `
      globalThis.__sizePlans = Array.from({ length: 35 }, (_, index) => index + 6)
        .map((studentCount) => ({
          studentCount,
          sizes: getLunchGroupSizes(studentCount),
        }));
    `,
  );

  for (const { studentCount, sizes } of context.__sizePlans) {
    assert.equal(
      sizes.reduce((total, size) => total + size, 0),
      studentCount,
    );
    assert.ok(
      sizes.every((size) => size >= 3),
      `${studentCount} students should not create a group smaller than 3`,
    );
  }
});
