// 새 학생은 끝에 추가해 기존 localStorage의 student-N 자리/기록 매핑을 유지합니다.
const STUDENTS = [
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
  "이서현",
];

const LOOKS = [
  { skin: "#f2c7a1", hair: "#2f2119", shirt: "#3367d6" },
  { skin: "#e8b98e", hair: "#171717", shirt: "#12a87d" },
  { skin: "#f4d0ad", hair: "#5a3825", shirt: "#ef6a4e" },
  { skin: "#dca982", hair: "#222b3a", shirt: "#7c5cff" },
  { skin: "#f0c3a6", hair: "#493026", shirt: "#f6c547" },
  { skin: "#c98f67", hair: "#201915", shirt: "#2f8fed" },
  { skin: "#edbd91", hair: "#3a2b20", shirt: "#e0527d" },
];

const MOOD_LABELS = {
  best: "최고",
  good: "괜찮음",
  soso: "쏘쏘",
  bad: "아쉬움",
};

const STORAGE_KEY = "classroomLunch.entries";
const SEATING_KEY = "classroomLunch.seating";
const MENU_VOTE_KEY = "classroomLunch.restaurantVotes";
const BEST_MENU_KEY = "classroomLunch.bestRestaurants";
const SEAT_COUNT = 32;

const leftBlock = document.querySelector("#left-block");
const rightBlock = document.querySelector("#right-block");
const bestFeed = document.querySelector("#best-feed");
const boardFeed = document.querySelector("#board-feed");
const boardWriter = document.querySelector("#board-writer");
const entryCount = document.querySelector("#entry-count");
const studentCount = document.querySelector("#student-count");
const eraserButton = document.querySelector("#eraser-button");
const teacherNotice = document.querySelector("#teacher-notice");
const teacherButton = document.querySelector("#teacher-button");
const teacherDialog = document.querySelector("#teacher-dialog");
const closeTeacherDialog = document.querySelector("#close-teacher-dialog");
const reviewList = document.querySelector("#review-list");
const makeGroupsButton = document.querySelector("#make-groups");
const groupList = document.querySelector("#group-list");
const saveTopMenuButton = document.querySelector("#save-top-menu");
const menuRankList = document.querySelector("#menu-rank-list");
const savedMenuList = document.querySelector("#saved-menu-list");
const dialog = document.querySelector("#lunch-dialog");
const form = document.querySelector("#lunch-form");
const dialogName = document.querySelector("#dialog-name");
const restaurantInput = document.querySelector("#restaurant-input");
const menuInput = document.querySelector("#menu-input");
const reviewInput = document.querySelector("#review-input");
const distanceInput = document.querySelector("#distance-input");
const deleteButton = document.querySelector("#delete-entry");
const closeButton = document.querySelector("#close-dialog");
const moodButtons = document.querySelectorAll(".mood");

const state = {
  entries: {},
  selectedId: "",
  selectedMood: "best",
  eraseMode: false,
  calledId: "",
  boardWriterId: "",
  seatingOrder: [],
  menuVotes: {},
  savedBestMenus: [],
  draggingId: "",
  justSwapped: false,
};

function loadEntries() {
  const saved = localStorage.getItem(STORAGE_KEY);

  try {
    state.entries = saved ? JSON.parse(saved) : {};
  } catch {
    state.entries = {};
    localStorage.removeItem(STORAGE_KEY);
  }

  removeOldSeatEntries();
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function loadMenuData() {
  try {
    state.menuVotes = JSON.parse(localStorage.getItem(MENU_VOTE_KEY)) || {};
    if (!state.menuVotes || Array.isArray(state.menuVotes)) {
      state.menuVotes = {};
    }
  } catch {
    state.menuVotes = {};
    localStorage.removeItem(MENU_VOTE_KEY);
  }

  try {
    state.savedBestMenus = JSON.parse(localStorage.getItem(BEST_MENU_KEY)) || [];
    if (!Array.isArray(state.savedBestMenus)) {
      state.savedBestMenus = [];
    }
  } catch {
    state.savedBestMenus = [];
    localStorage.removeItem(BEST_MENU_KEY);
  }
}

function saveMenuVotes() {
  localStorage.setItem(MENU_VOTE_KEY, JSON.stringify(state.menuVotes));
}

function saveBestMenus() {
  localStorage.setItem(BEST_MENU_KEY, JSON.stringify(state.savedBestMenus));
}

function loadSeating() {
  const saved = localStorage.getItem(SEATING_KEY);

  try {
    state.seatingOrder = normalizeSeating(saved ? JSON.parse(saved) : []);
  } catch {
    state.seatingOrder = normalizeSeating([]);
    localStorage.removeItem(SEATING_KEY);
  }

  saveSeating();
}

function saveSeating() {
  localStorage.setItem(SEATING_KEY, JSON.stringify(state.seatingOrder));
}

function normalizeSeating(seats) {
  const validIds = new Set(STUDENTS.map((_, index) => getStudentId(index)));
  const usedIds = new Set();
  const normalized = Array.isArray(seats) ? seats.slice(0, SEAT_COUNT) : [];

  while (normalized.length < SEAT_COUNT) {
    normalized.push("");
  }

  normalized.forEach((id, index) => {
    if (!validIds.has(id) || usedIds.has(id)) {
      normalized[index] = "";
      return;
    }

    usedIds.add(id);
  });

  STUDENTS.forEach((_, index) => {
    const id = getStudentId(index);

    if (usedIds.has(id)) {
      return;
    }

    const emptyIndex = normalized.indexOf("");
    if (emptyIndex > -1) {
      normalized[emptyIndex] = id;
      usedIds.add(id);
    }
  });

  return normalized.slice(0, SEAT_COUNT);
}

function removeOldSeatEntries() {
  const validIds = new Set(STUDENTS.map((_, index) => getStudentId(index)));

  Object.keys(state.entries).forEach((id) => {
    if (!validIds.has(id)) {
      delete state.entries[id];
    }
  });

  saveEntries();
}

function getStudent(id) {
  return STUDENTS.find((_, index) => getStudentId(index) === id);
}

function getStudentId(index) {
  return `student-${index + 1}`;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderClassroom() {
  leftBlock.innerHTML = "";
  rightBlock.innerHTML = "";
  studentCount.textContent = String(STUDENTS.length);
  state.seatingOrder = normalizeSeating(state.seatingOrder);

  const leftSeats = state.seatingOrder.slice(0, 16);
  const rightSeats = state.seatingOrder.slice(16, SEAT_COUNT);

  leftSeats.forEach((studentId, slotIndex) => {
    leftBlock.append(
      studentId ? createSeat(studentId, slotIndex) : createEmptySeat(slotIndex)
    );
  });

  rightSeats.forEach((studentId, index) => {
    const slotIndex = index + 16;
    rightBlock.append(
      studentId ? createSeat(studentId, slotIndex) : createEmptySeat(slotIndex)
    );
  });
}

function makeLunchGroups() {
  const shuffledStudents = shuffle(STUDENTS);
  const groups = [];

  for (let index = 0; index < shuffledStudents.length; index += 4) {
    groups.push(shuffledStudents.slice(index, index + 4));
  }

  if (groups.length > 1 && groups[groups.length - 1].length === 1) {
    groups[groups.length - 2].push(groups[groups.length - 1][0]);
    groups.pop();
  }

  renderLunchGroups(groups);
  teacherNotice.textContent = "점심 조가 새로 정해졌습니다.";
}

function renderLunchGroups(groups) {
  groupList.innerHTML = "";

  if (groups.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-group";
    item.textContent = "버튼을 누르면 점심 조가 무작위로 만들어집니다.";
    groupList.append(item);
    return;
  }

  groups.forEach((group, index) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const names = document.createElement("span");

    title.textContent = `${index + 1}조`;
    names.textContent = group.join(", ");
    item.append(title, names);
    groupList.append(item);
  });
}

function getMenuRankings() {
  const menuMap = new Map();

  Object.values(state.entries).forEach((entry) => {
    const menu = getEntryPlace(entry);

    if (!menu || menu === "가게 미입력") {
      return;
    }

    const key = normalizeMenu(menu);
    const current = menuMap.get(key) || {
      key,
      menu,
      eatCount: 0,
      votes: state.menuVotes[key] || 0,
    };
    current.eatCount += 1;
    current.menu = menu;
    menuMap.set(key, current);
  });

  Object.entries(state.menuVotes).forEach(([key, votes]) => {
    if (!menuMap.has(key) && votes > 0) {
      menuMap.set(key, { key, menu: key, eatCount: 0, votes });
    }
  });

  return [...menuMap.values()].sort((a, b) => {
    const scoreGap = getMenuScore(b) - getMenuScore(a);
    return scoreGap || b.eatCount - a.eatCount || a.menu.localeCompare(b.menu);
  });
}

function getMenuScore(menu) {
  return menu.eatCount + menu.votes;
}

function normalizeMenu(menu) {
  return menu.trim().replace(/\s+/g, " ").toLowerCase();
}

function renderMenuRankings() {
  const rankings = getMenuRankings();

  menuRankList.innerHTML = "";
  savedMenuList.innerHTML = "";

  if (rankings.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-ranking";
    item.textContent = "가게가 올라오면 자동으로 랭킹이 만들어집니다.";
    menuRankList.append(item);
    saveTopMenuButton.disabled = true;
  } else {
    saveTopMenuButton.disabled = false;
    rankings.slice(0, 5).forEach((menu, index) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const voteButton = document.createElement("button");

      item.className = index === 0 ? "top-menu" : "";
      name.textContent = `${index + 1}위 ${menu.menu}`;
      meta.textContent = `총 ${getMenuScore(menu)}점 · 방문한 사람 ${
        menu.eatCount
      }명 · 투표 ${menu.votes}표`;
      voteButton.type = "button";
      voteButton.textContent = "투표";
      voteButton.addEventListener("click", () => voteForMenu(menu.key));
      item.append(name, meta, voteButton);
      menuRankList.append(item);
    });
  }

  if (state.savedBestMenus.length === 0) {
    const item = document.createElement("li");
    item.textContent = "아직 저장한 베스트 가게가 없습니다.";
    savedMenuList.append(item);
    return;
  }

  state.savedBestMenus.forEach((menu) => {
    const item = document.createElement("li");
    item.textContent = `${menu.menu} · ${menu.score}점`;
    savedMenuList.append(item);
  });
}

function voteForMenu(menuKey) {
  state.menuVotes[menuKey] = (state.menuVotes[menuKey] || 0) + 1;
  saveMenuVotes();
  renderMenuRankings();
}

function saveTopMenu() {
  const topMenu = getMenuRankings()[0];

  if (!topMenu) {
    return;
  }

  const savedMenu = {
    menu: topMenu.menu,
    key: topMenu.key,
    score: getMenuScore(topMenu),
    savedAt: Date.now(),
  };
  state.savedBestMenus = [
    savedMenu,
    ...state.savedBestMenus.filter((menu) => menu.key !== topMenu.key),
  ].slice(0, 8);
  saveBestMenus();
  teacherNotice.textContent = `${topMenu.menu} 가게를 베스트 가게로 저장했습니다.`;
  renderMenuRankings();
}

function createSeat(id, slotIndex) {
  const studentIndex = Number(id.replace("student-", "")) - 1;
  const name = getStudent(id);
  const look = LOOKS[studentIndex % LOOKS.length];
  const entry = state.entries[id];
  const seat = document.createElement("button");
  const person = document.createElement("span");
  const face = document.createElement("span");
  const hair = document.createElement("span");
  const leftEye = document.createElement("span");
  const rightEye = document.createElement("span");
  const mouth = document.createElement("span");
  const body = document.createElement("span");
  const leftArm = document.createElement("span");
  const rightArm = document.createElement("span");
  const desk = document.createElement("span");

  seat.type = "button";
  seat.className = `seat ${entry ? `mood-${entry.mood}` : "mood-good"}`;
  seat.classList.toggle("called", state.calledId === id);
  seat.dataset.id = id;
  seat.dataset.slot = String(slotIndex);
  seat.draggable = true;
  seat.setAttribute("aria-label", `${name} 자리. 드래그해서 자리 바꾸기`);
  seat.style.setProperty("--skin", look.skin);
  seat.style.setProperty("--hair", look.hair);
  seat.style.setProperty("--shirt", look.shirt);

  if (entry) {
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    const prefix = entry.teacherBad ? "다시 " : entry.best ? "베스트 " : "";
    bubble.textContent = `${prefix}${getEntryMenu(entry)} @ ${getEntryPlace(
      entry
    )}: ${entry.review}`;
    seat.append(bubble);
  }

  person.className = "person";
  face.className = "face";
  hair.className = "hair";
  leftEye.className = "eye left";
  rightEye.className = "eye right";
  mouth.className = "mouth";
  body.className = "body";
  leftArm.className = "arm left";
  rightArm.className = "arm right";
  desk.className = "desk";
  desk.textContent = name;

  face.append(hair, leftEye, rightEye, mouth);
  body.append(leftArm, rightArm);
  person.append(face, body);
  seat.append(person, desk);
  seat.addEventListener("click", () => {
    if (state.justSwapped) {
      return;
    }

    openEditor(id);
  });
  addSeatDropEvents(seat);
  seat.addEventListener("dragstart", handleDragStart);
  seat.addEventListener("dragend", handleDragEnd);

  return seat;
}

function createEmptySeat(slotIndex) {
  const seat = document.createElement("div");
  seat.className = "seat empty";
  seat.dataset.slot = String(slotIndex);
  seat.innerHTML = '<span class="desk">빈 자리</span>';
  addSeatDropEvents(seat);
  return seat;
}

function addSeatDropEvents(seat) {
  seat.addEventListener("dragover", (event) => {
    event.preventDefault();
    seat.classList.add("drop-target");
  });
  seat.addEventListener("dragleave", () => {
    seat.classList.remove("drop-target");
  });
  seat.addEventListener("drop", handleSeatDrop);
}

function handleDragStart(event) {
  state.draggingId = event.currentTarget.dataset.id;
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggingId);
}

function handleDragEnd(event) {
  state.draggingId = "";
  event.currentTarget.classList.remove("dragging");
  document.querySelectorAll(".drop-target").forEach((seat) => {
    seat.classList.remove("drop-target");
  });
}

function handleSeatDrop(event) {
  event.preventDefault();
  const targetSlot = Number(event.currentTarget.dataset.slot);
  const draggedId = state.draggingId || event.dataTransfer.getData("text/plain");

  if (!draggedId) {
    return;
  }

  const sourceSlot = state.seatingOrder.indexOf(draggedId);

  if (sourceSlot === -1 || sourceSlot === targetSlot) {
    return;
  }

  const targetId = state.seatingOrder[targetSlot];
  state.seatingOrder[targetSlot] = draggedId;
  state.seatingOrder[sourceSlot] = targetId || "";
  state.justSwapped = true;
  saveSeating();
  renderClassroom();
  teacherNotice.textContent = "자리를 바꿨습니다.";
  setTimeout(() => {
    state.justSwapped = false;
  }, 150);
}

function renderBoard() {
  const entries = Object.entries(state.entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const bestEntries = entries.filter((entry) => entry.best && !entry.teacherBad);

  entryCount.textContent = String(entries.length);
  bestFeed.innerHTML = "";
  boardFeed.innerHTML = "";

  if (bestEntries.length === 0) {
    const item = document.createElement("li");
    item.textContent = "아직 베스트 답변이 없습니다.";
    bestFeed.append(item);
  } else {
    bestEntries.slice(0, 4).forEach((entry) => {
      bestFeed.append(createBoardItem(entry, true));
    });
  }

  if (entries.length === 0) {
    const item = document.createElement("li");
    item.textContent = "아직 올라온 점심 이야기가 없습니다.";
    boardFeed.append(item);
    return;
  }

  entries.slice(0, 8).forEach((entry) => {
    boardFeed.append(createBoardItem(entry, false));
  });
}

function renderBoardWriter() {
  boardWriter.innerHTML = "";

  if (!state.boardWriterId || !state.entries[state.boardWriterId]) {
    boardWriter.classList.remove("show");
    return;
  }

  const entry = state.entries[state.boardWriterId];
  const studentIndex = Number(state.boardWriterId.replace("student-", "")) - 1;
  const look = LOOKS[studentIndex % LOOKS.length];
  const note = document.createElement("span");
  const person = document.createElement("span");
  const face = document.createElement("span");
  const hair = document.createElement("span");
  const leftEye = document.createElement("span");
  const rightEye = document.createElement("span");
  const mouth = document.createElement("span");
  const body = document.createElement("span");
  const chalk = document.createElement("span");
  const name = document.createElement("strong");

  boardWriter.classList.add("show");
  boardWriter.style.setProperty("--skin", look.skin);
  boardWriter.style.setProperty("--hair", look.hair);
  boardWriter.style.setProperty("--shirt", look.shirt);
  note.className = "writer-note";
  note.textContent = `${entry.name}: ${getEntryMenu(entry)} 베스트`;
  person.className = "person";
  face.className = "face";
  hair.className = "hair";
  leftEye.className = "eye left";
  rightEye.className = "eye right";
  mouth.className = "mouth";
  body.className = "body";
  chalk.className = "chalk";
  name.textContent = entry.name;

  face.append(hair, leftEye, rightEye, mouth);
  body.append(chalk);
  person.append(face, body);
  boardWriter.append(note, person, name);
}

function openTeacherReview() {
  renderTeacherReview();
  teacherDialog.showModal();
}

function renderTeacherReview() {
  const entries = Object.entries(state.entries)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  reviewList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-review";
    empty.textContent = "아직 심사할 이야기가 없습니다.";
    reviewList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("article");
    const text = document.createElement("p");
    const actions = document.createElement("div");
    const bestButton = document.createElement("button");
    const badButton = document.createElement("button");

    item.className = entry.teacherBad ? "review-item bad-picked" : "review-item";
    text.textContent = `${entry.name}: ${getEntryPlace(entry)} / ${getEntryMenu(
      entry
    )} / ${entry.distance || "거리 미입력"} / ${entry.review}`;
    actions.className = "review-actions";
    bestButton.type = "button";
    bestButton.className = entry.best ? "best-action active" : "best-action";
    bestButton.textContent = entry.best ? "베스트됨" : "베스트";
    badButton.type = "button";
    badButton.className = entry.teacherBad ? "bad-action active" : "bad-action";
    badButton.textContent = entry.teacherBad ? "불렀음" : "별로";
    bestButton.addEventListener("click", () => chooseBestEntry(entry.id));
    badButton.addEventListener("click", () => chooseBadEntry(entry.id));

    actions.append(bestButton, badButton);
    item.append(text, actions);
    reviewList.append(item);
  });
}

function chooseBestEntry(id) {
  const entry = state.entries[id];

  if (!entry) {
    return;
  }

  entry.best = true;
  entry.teacherBad = false;
  entry.updatedAt = Date.now();
  state.calledId = "";
  state.boardWriterId = id;
  teacherNotice.textContent = `${entry.name}, 칠판에 베스트 답변 적어주세요.`;
  saveEntries();
  renderClassroom();
  renderBoardWriter();
  renderBoard();
  renderMenuRankings();
  renderTeacherReview();
}

function chooseBadEntry(id) {
  const entry = state.entries[id];

  if (!entry) {
    return;
  }

  entry.best = false;
  entry.teacherBad = true;
  entry.mood = "bad";
  entry.moodLabel = MOOD_LABELS.bad;
  entry.updatedAt = Date.now();
  if (state.boardWriterId === id) {
    state.boardWriterId = "";
  }
  saveEntries();
  callStudentForward(id);
  teacherNotice.textContent = `${entry.name}, 이 답변은 다시 말해볼까요?`;
  renderBoardWriter();
  renderBoard();
  renderMenuRankings();
  teacherDialog.close();
}

function createBoardItem(entry, isBest) {
  const item = document.createElement("li");
  const moodLabel = entry.moodLabel || MOOD_LABELS[entry.mood] || "";
  item.dataset.id = entry.id;
  item.textContent = isBest
    ? `${entry.name}: ${getEntryPlace(entry)} / ${getEntryMenu(entry)} / ${
        entry.distance || "거리 미입력"
      } / ${entry.review}`
    : `${entry.name} 대신 드립니다: ${getEntryPlace(entry)} ${getEntryMenu(
        entry
      )} ${
        entry.teacherBad ? "별로" : moodLabel
      } / ${entry.review}`;
  item.addEventListener("click", () => eraseBoardMessage(entry.id));
  return item;
}

function getEntryPlace(entry) {
  return entry.restaurant || "가게 미입력";
}

function getEntryMenu(entry) {
  return entry.menu || entry.food || "메뉴 미입력";
}

function openEditor(id) {
  const name = getStudent(id);
  const entry = state.entries[id];

  state.selectedId = id;
  state.selectedMood = entry?.mood || "best";
  dialogName.textContent = name;
  restaurantInput.value = entry?.restaurant || "";
  menuInput.value = entry ? getEntryMenu(entry) : "";
  reviewInput.value = entry?.review || "";
  distanceInput.value = entry?.distance || "";
  updateMoodButtons();
  dialog.showModal();
  restaurantInput.focus();
}

function updateMoodButtons() {
  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === state.selectedMood);
  });
}

function setMood(mood) {
  state.selectedMood = mood;
  updateMoodButtons();
}

function submitEntry(event) {
  event.preventDefault();

  const restaurant = restaurantInput.value.trim();
  const menu = menuInput.value.trim();
  const review = reviewInput.value.trim();
  const distance = distanceInput.value.trim();

  if (!restaurant || !review) {
    reviewInput.placeholder = "필수 항목인 가게 이름과 어땠나요를 적어 주세요.";
    return;
  }

  if (isWeirdAnswer(restaurant, menu, review, distance)) {
    callStudentForward(state.selectedId);
    dialog.close();
    return;
  }

  state.entries[state.selectedId] = {
    name: getStudent(state.selectedId),
    restaurant,
    menu,
    review,
    distance,
    mood: state.selectedMood,
    moodLabel: MOOD_LABELS[state.selectedMood],
    best: false,
    teacherBad: false,
    updatedAt: Date.now(),
  };

  state.calledId = "";
  if (state.boardWriterId === state.selectedId) {
    state.boardWriterId = "";
  }
  teacherNotice.textContent = "강사를 클릭해서 베스트 답변을 골라요.";
  saveEntries();
  renderClassroom();
  renderBoardWriter();
  renderBoard();
  renderMenuRankings();
  dialog.close();
}

function deleteEntry() {
  if (!state.selectedId) {
    return;
  }

  delete state.entries[state.selectedId];
  if (state.boardWriterId === state.selectedId) {
    state.boardWriterId = "";
  }
  saveEntries();
  renderClassroom();
  renderBoardWriter();
  renderBoard();
  renderMenuRankings();
  dialog.close();
}

function toggleEraseMode() {
  state.eraseMode = !state.eraseMode;
  eraserButton.classList.toggle("active", state.eraseMode);
  eraserButton.setAttribute("aria-pressed", String(state.eraseMode));
  bestFeed.classList.toggle("erase-mode", state.eraseMode);
  boardFeed.classList.toggle("erase-mode", state.eraseMode);
}

function eraseBoardMessage(id) {
  if (!state.eraseMode) {
    return;
  }

  delete state.entries[id];
  if (state.boardWriterId === id) {
    state.boardWriterId = "";
  }
  saveEntries();
  renderClassroom();
  renderBoardWriter();
  renderBoard();
  renderMenuRankings();
  toggleEraseMode();
}

function isWeirdAnswer(restaurant, menu, review, distance) {
  const text = `${restaurant} ${menu} ${review} ${distance}`
    .replace(/\s/g, "")
    .toLowerCase();
  const blockedWords = ["시발", "ㅅㅂ", "욕", "바보", "멍청", "때려", "똥", "오줌"];
  const hasBlockedWord = blockedWords.some((word) => text.includes(word));
  const hasRepeatedNoise = /(.)\1{5,}/.test(text);
  const isEmptyLike = ["몰라", "없음", "안먹음", "노코멘트"].includes(text);

  return hasBlockedWord || hasRepeatedNoise || isEmptyLike;
}

function callStudentForward(id) {
  state.calledId = id;
  teacherNotice.textContent = `${getStudent(id)}, 앞으로 나와서 다시 적어볼까요?`;
  renderClassroom();
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => setMood(button.dataset.mood));
});
form.addEventListener("submit", submitEntry);
deleteButton.addEventListener("click", deleteEntry);
closeButton.addEventListener("click", () => dialog.close());
eraserButton.addEventListener("click", toggleEraseMode);
teacherButton.addEventListener("click", openTeacherReview);
teacherButton.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openTeacherReview();
  }
});
closeTeacherDialog.addEventListener("click", () => teacherDialog.close());
makeGroupsButton.addEventListener("click", makeLunchGroups);
saveTopMenuButton.addEventListener("click", saveTopMenu);

loadEntries();
loadMenuData();
loadSeating();
renderClassroom();
renderBoardWriter();
renderBoard();
renderMenuRankings();
renderLunchGroups([]);
