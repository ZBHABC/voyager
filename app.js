const bootstrap = window.SHIGUANG_BOOTSTRAP || {};
const apiBase = bootstrap.apiBase || "api.php";
const app = document.getElementById("app");

const destinations = Array.isArray(bootstrap.destinations) ? bootstrap.destinations : [];
const navItems = [
  ["/", "世界探索", "compass"],
  ["/advisor", "AI旅行顾问", "spark"],
  ["/planner", "行程规划", "route"],
  ["/memories", "旅行记忆", "book"],
  ["/recommend", "推荐好地方", "star"],
  ["/wishlist", "愿望清单", "heart"],
  ["/profile", "个人画像", "user"],
  ["/settings", "设置", "settings"],
];

const state = {
  route: location.hash.replace("#", "") || "/",
  selectedId: destinations[0]?.id || "",
  theme: initialTheme(),
  wished: readJson("shiguang-wishlist", []),
  dismissed: readJson("shiguang-dismissed", []),
  messages: readJson("shiguang-ai-current", []),
  chatSessions: readJson("shiguang-ai-sessions", []),
  chatHistoryOpen: false,
  advisorDraft: readJson("shiguang-advisor-draft", ""),
  aiExpanded: false,
  aiScrollTop: 0,
  aiStickToBottom: true,
  mapPopupOpen: false,
  mapPickedPlace: null,
  pendingDetailPlace: null,
  heroDismissed: false,
  activeDestinationTab: "总览",
  plannerTags: [],
  preferenceType: "like",
  recommendFilters: [],
  recommendations: [],
  preferenceReport: null,
  recommendationsLoaded: false,
  plans: [],
  planHistory: readJson("shiguang-trip-plans", []),
  planHistoryOpen: false,
  plansLoaded: false,
  tripRecords: readJson("shiguang-trip-records", Array.isArray(bootstrap.tripRecords) ? bootstrap.tripRecords : []),
  preferences: Array.isArray(bootstrap.preferenceMemory) ? bootstrap.preferenceMemory : [],
  integrations: null,
  galleryImages: [],
  destinationMedia: readJson("shiguang-destination-media", {}),
  destinationDetails: {},
  mediaAttempts: {},
  mapMediaController: null,
  pendingPlanDestination: "",
  mapLayer: "smart",
  mapPreferenceOnly: false,
  mapImmersive: false,
  planningTransition: false,
  planningDraft: null,
  popupSide: "right",
  popupTop: 158,
  loading: {},
  toasts: [],
  amap: null,
  // Dify 工作流进度
  workflowProgress: {
    visible: false,
    status: "idle", // idle | running | completed | error
    steps: [],
    fallback: null,
    startedAt: null,
    workflowRunId: "",
  },
  workflowController: null,
  chatController: null,
  chatWorkflowExpanded: true,
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initialTheme() {
  const saved = localStorage.getItem("shiguang-theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function endpoint(path) {
  const [name, query = ""] = String(path).split("?");
  return `${apiBase}?path=${encodeURIComponent(name)}${query ? `&${query}` : ""}`;
}

async function apiJson(path, payload, signal) {
  const headers = {};
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(endpoint(path), {
    method: payload === undefined ? "GET" : "POST",
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `API ${path} failed`);
  return result;
}

function setLoading(key, value) {
  state.loading[key] = value;
  render();
}

function toast(text, type = "info") {
  state.toasts = [{ id: Date.now(), text, type }, ...state.toasts].slice(0, 4);
  render();
  setTimeout(() => {
    state.toasts = state.toasts.filter((item) => item.text !== text);
    render();
  }, 3000);
}

function icon(name, cls = "") {
  const paths = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6 6-2Z"/>',
    spark: '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/>',
    route: '<path d="M4 6h4a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h13"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="20" r="2"/>',
    book: '<path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4V4Z"/><path d="M5 16a4 4 0 0 1 4 4"/>',
    star: '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3Z"/>',
    heart: '<path d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 22l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 14.8A8.5 8.5 0 0 1 9.2 3a7 7 0 1 0 11.8 11.8Z"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    calendar: '<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="5" width="18" height="18" rx="3"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    plane: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v6l4 2"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10" r="1.5"/><path d="m7 17 4.2-4.2a2 2 0 0 1 2.8 0L18 17"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    filter: '<path d="M4 4h16l-6 7v6l-4 3v-9L4 4Z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 1 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.65V21.3a2.1 2.1 0 1 1-4.2 0v-.06a1.8 1.8 0 0 0-1.08-1.65 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 1 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.08H2.9a2.1 2.1 0 1 1 0-4.2h.06A1.8 1.8 0 0 0 4.6 8.64a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 1 1 2.97-2.97l.04.04a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.27 2.4V2.1a2.1 2.1 0 1 1 4.2 0v.3a1.8 1.8 0 0 0 1.08 1.65 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 1 1 2.97 2.97l-.04.04a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.08h.3a2.1 2.1 0 1 1 0 4.2h-.3A1.8 1.8 0 0 0 19.4 15Z"/>',
    external: '<path d="M14 3h7v7"/><path d="m21 3-9 9"/><path d="M5 7v12h12v-5"/>',
    spinner: '<path d="M21 12a9 9 0 1 1-6.2-8.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>',
  };
  return `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

function button(label, action, options = {}) {
  const cls = options.cls || "ghost";
  const attrs = [
    `class="${cls}"`,
    `data-action="${esc(action)}"`,
    options.id ? `data-id="${esc(options.id)}"` : "",
    options.value ? `data-value="${esc(options.value)}"` : "",
    options.route ? `data-route="${esc(options.route)}"` : "",
    options.text ? `data-text="${esc(options.text)}"` : "",
    options.disabled ? "disabled" : "",
    options.aria ? `aria-label="${esc(options.aria)}"` : "",
  ].filter(Boolean).join(" ");
  return `<button ${attrs}>${options.icon ? icon(options.icon, options.iconClass || "") : ""}<span>${label}</span></button>`;
}

function chip(label, action, active, options = {}) {
  return button(label, action, { ...options, cls: `chip ${active ? "on" : ""}`, value: label });
}

function tagrow(items) {
  return `<div class="tagrow">${(items || []).map((item) => `<span>${esc(item)}</span>`).join("")}</div>`;
}

function destinationPhoto(destination, cls = "cardimg", index = 0) {
  const media = state.destinationMedia[destination.id] || [];
  const image = media[index] || media[0];
  if (image?.url) {
    return `<div class="${cls} has-photo"><img src="${esc(image.url)}" alt="${esc(image.caption || destination.name)}" loading="lazy"><span>${esc(image.provider || "image")}</span></div>`;
  }
  if (isDestinationMediaLoading(destination)) {
    return `<div class="${cls} media-skeleton" aria-label="图片加载中"></div>`;
  }
  return `<div class="${cls} ${esc(destination.img)}"></div>`;
}

function photoStyle(destination, index = 0) {
  const media = state.destinationMedia[destination.id] || [];
  const image = media[index] || media[0];
  return image?.url ? ` style="--photo:url('${esc(image.url)}')"` : "";
}

function destinationMediaQuery(destination) {
  const searchNames = {
    swiss: "Interlaken Alps Switzerland",
    morocco: "Marrakech Morocco medina market",
    nz: "Queenstown New Zealand",
    lisbon: "Porto Portugal riverside city",
    iceland: "Iceland northern lights waterfalls",
    dali: "Dali Erhai Yunnan lake",
    "瑞士·因特拉肯": "Interlaken Alps Switzerland",
    "摩洛哥·马拉喀什": "Marrakech Morocco medina market",
    "新西兰·南岛": "Queenstown New Zealand",
    "葡萄牙·波尔图": "Porto Portugal riverside city",
    "冰岛极光环岛": "Iceland northern lights waterfalls",
    "大理·洱海慢游": "Dali Erhai Yunnan lake",
  };
  // mediaQuery takes priority (set by createPickedPlace for map clicks)
  if (destination?.mediaQuery) return destination.mediaQuery;
  // Known destinations get precise English search terms
  const known = searchNames[destination?.id] || searchNames[destination?.name];
  if (known) return known;
  // For Chinese-named destinations, combine English country with local name
  const name = destination?.name || "travel landmark";
  const country = destination?.country || "";
  const hasChinese = /[\u4e00-\u9fff]/.test(name);
  if (hasChinese && country) {
    return `${country} ${name} travel landmark scenery`;
  }
  return name;
}

function isDestinationMediaLoading(destination) {
  return Boolean(destination?.id && state.loading[`media-${destination.id}`]);
}

function recordMemoryDestination(record) {
  const name = record?.destination || "旅行记忆";
  const searchNames = {
    "厦门": "Xiamen coastal city Gulangyu",
    "西安": "Xi'an ancient city wall terracotta warriors",
    "挪威": "Norway fjord northern lights landscape",
  };
  return {
    id: `memory-record-${name}`,
    name,
    mediaQuery: searchNames[name] || name,
    img: "memory-photo-fallback",
  };
}

function recordMemoryStyle(record) {
  const media = state.destinationMedia[recordMemoryDestination(record).id] || [];
  const image = media[0];
  return image?.url ? ` style="--memory-photo:url('${esc(image.url)}')"` : "";
}

function memoryRecordRoute(index) {
  return `/memory/${index}`;
}

function memoryRecordFromRoute(route = state.route) {
  const records = state.tripRecords.length ? state.tripRecords : bootstrap.tripRecords || [];
  const index = Number(String(route || "").split("/").pop());
  return Number.isInteger(index) && records[index] ? { record: records[index], index } : { record: records[0], index: 0 };
}

function memoryRecordItinerary(record) {
  const name = record?.destination || "这座城市";
  if (name.includes("厦门")) return ["沙坡尾与老街慢逛", "环岛路海边留白", "八市/咖啡小店生活感采样"];
  if (name.includes("西安")) return ["城墙与碑林控制半日节奏", "陕西历史博物馆提前预约", "傍晚回民街周边只选少量店"];
  if (name.includes("挪威")) return ["峡湾观景主线", "高纬天气备选窗口", "夜间极光追踪和休息日"];
  return [`${name} 核心区域回顾`, "保留一个主体验", "记录下次需要避开的重复安排"];
}

function recordMemoryCard(record, index) {
  const tags = tagrow([record.mood, `¥${record.cost}`]);
  return `<article class="memory-photo-card memory-photo-${index % 3}" data-action="go" data-route="${esc(memoryRecordRoute(index))}" tabindex="0"${recordMemoryStyle(record)}>
    <div class="memory-photo-copy">
      <small>${esc(record.date)}</small>
      <h3>${esc(record.destination)}</h3>
      <p>${esc(record.summary)}</p>
      ${tags}
    </div>
  </article>`;
}

function memoryDetailPage(route = state.route) {
  const { record, index } = memoryRecordFromRoute(route);
  if (!record) return shell(header("旅行记忆", "还没有可打开的历史记录。", button("返回", "go", { cls: "ghost", route: "/memories", icon: "close" })) + emptyState("暂无旅行记忆", "先生成或加入一条旅行记忆后，这里会展示详情。"));
  const memoryDestination = recordMemoryDestination(record);
  const related = destinations.find((item) => record.destination && (item.name.includes(record.destination) || record.destination.includes(item.country) || record.destination.includes(item.region)));
  const actions = `${button("返回记忆", "go", { cls: "ghost", route: "/memories", icon: "close" })}${button("按这条记忆规划", "go", { cls: "primary", route: "/planner", icon: "route" })}`;
  const itinerary = memoryRecordItinerary(record);
  const relatedRoute = related ? `/destination/${related.id}` : "/recommend";
  return shell(header(`${record.destination}旅行记忆`, `${record.date} · ${record.mood} · ¥${record.cost}`, actions) + `<section class="panel memory-detail-hero">
    ${destinationPhoto(memoryDestination, "cover")}
    <div>
      <small>来自旅行记录数据库</small>
      <h1>${esc(record.destination)}</h1>
      <p class="muted">${esc(record.summary)}</p>
      ${tagrow([record.mood, `预算 ¥${record.cost}`, `记录 #${index + 1}`])}
    </div>
  </section>
  <div class="grid2 memory-detail-grid">
    <section class="panel">
      ${panelTitle("当时规划信息", "点击卡片进入的详情")}
      <div class="timeline">${itinerary.map((item, i) => planDay({ title: item, morning: "按当时偏好保留主线体验", afternoon: "控制景点数量，给交通和休息留余量", evening: "补充本地生活感和照片整理", notes: i === 0 ? record.summary : "" }, i)).join("")}</div>
    </section>
    <aside class="panel memory-detail-side">
      ${panelTitle("地点信息", related ? "已匹配推荐库" : "未匹配推荐库")}
      ${infoCard("偏好影响", `${record.destination} 会作为画像记忆影响后续推荐排序，重点参考：${record.summary}`)}
      ${infoCard("下次建议", related ? `可继续查看 ${related.name} 的图片、路线、预算与避坑信息。` : "可前往推荐好地方，选择相近目的地查看图片、路线、预算与避坑信息。")}
      ${button(related ? "查看关联目的地" : "查看推荐详情", "go", { cls: "primary full", route: relatedRoute, icon: "external" })}
    </aside>
  </div>`);
}

function panelTitle(title, action = "") {
  return `<div class="ptitle"><b>${esc(title)}</b>${action ? `<small>${esc(action)}</small>` : ""}</div>`;
}

function selectedDestination() {
  return destinations.find((item) => item.id === state.selectedId) || destinations[0] || {};
}

function activeMapPlace() {
  return state.mapPickedPlace || selectedDestination();
}

function routeDestination(route = state.route) {
  const id = String(route || "").startsWith("/destination/") ? String(route).split("/").pop() : "";
  return destinations.find((item) => item.id === id) || state.pendingDetailPlace || selectedDestination();
}

function preferenceMetrics() {
  const buckets = [
    ["人文", ["人文", "历史", "古建", "老街", "咖啡", "城市", "市集", "本地"]],
    ["自然", ["自然", "湖泊", "雪山", "海边", "山", "风景", "极光", "瀑布", "星空"]],
    ["美食", ["美食", "餐", "咖啡", "小店", "酒", "饮食"]],
    ["摄影", ["摄影", "拍", "照片", "极光", "星空", "色彩", "风景"]],
    ["购物", ["购物", "市集", "商业", "伴手礼", "消费"]],
    ["夜生活", ["夜生活", "酒吧", "夜景", "晚间", "夜市"]],
  ];
  const scores = Object.fromEntries(buckets.map(([name]) => [name, 35]));
  for (const item of state.preferences) {
    if (!isUsefulPreference(item)) continue;
    const status = item.status || "pending";
    if (status === "ignored") continue;
    const sign = item.type === "avoid" ? -1 : 1;
    const statusWeight = status === "confirmed" ? 1 : 0.45;
    const strength = Math.max(0.35, Math.min(1, Number(item.weight || item.confidence || 0.7))) * statusWeight;
    const text = `${item.type || ""} ${item.title || ""} ${item.detail || ""} ${(item.tags || []).join(" ")}`;
    for (const [name, keywords] of buckets) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        scores[name] += sign * Math.round(26 * strength);
      }
    }
  }
  return buckets.map(([name]) => [name, Math.max(8, Math.min(99, scores[name]))]);
}

function preferenceMindMap(metrics) {
  const metricPositions = [
    [78, 22], [83, 55], [64, 80], [36, 80], [17, 55], [22, 22],
  ];
  const metricNodes = metrics.map(([name, value], index) => ({
    id: `metric-${index}`,
    label: name,
    value,
    x: metricPositions[index]?.[0] || 50,
    y: metricPositions[index]?.[1] || 50,
    tone: value >= 75 ? "hot" : value >= 50 ? "mid" : "calm",
  }));
  const memoryNodes = usefulPreferences(3).map((item, index) => ({
    id: `memory-${index}`,
    label: item.title || item.detail || "偏好记忆",
    value: Math.round((Number(item.weight || item.confidence || 0.7)) * 100),
    x: [24, 50, 76][index] || 50,
    y: 92,
    tone: "memory",
  }));
  const nodes = [
    { id: "core", label: "旅行画像", value: profileAffinity(), x: 50, y: 47, tone: "core" },
    ...metricNodes,
    ...memoryNodes,
  ];
  const edges = nodes.filter((node) => node.id !== "core").map((node) => ["core", node.id]);
  const lines = edges.map(([from, to]) => {
    const a = nodes.find((node) => node.id === from);
    const b = nodes.find((node) => node.id === to);
    return `<line class="mind-link" data-from="${esc(from)}" data-to="${esc(to)}" x1="${esc(a.x)}%" y1="${esc(a.y)}%" x2="${esc(b.x)}%" y2="${esc(b.y)}%"></line>`;
  }).join("");
  const nodeViews = nodes.map((node, index) => `<button class="mind-node ${esc(node.tone)}" data-mind-node="${esc(node.id)}" data-x="${esc(node.x)}" data-y="${esc(node.y)}" style="left:${esc(node.x)}%;top:${esc(node.y)}%;--delay:${index * 0.18}s" type="button" aria-label="${esc(node.label)} ${esc(node.value)}">
    <span><b>${esc(node.label.length > 8 ? `${node.label.slice(0, 8)}...` : node.label)}</b><small>${esc(node.value)}%</small></span>
  </button>`).join("");
  return `<section class="preference-mind" aria-label="可拖拽偏好神经图">
    <div class="mind-head"><b>偏好神经图</b><small>拖拽节点，观察画像信号如何连接</small></div>
    <div class="mind-canvas">
      <svg class="mind-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${nodeViews}
    </div>
  </section>`;
}

function isBadPreferenceText(value) {
  const text = String(value || "").trim();
  if (!text) return true;
  if (/^[a-z0-9\s?.!,，。！？、-]{1,2}$/i.test(text)) return true;
  if (/\?{3,}|�|鎴|鏄|妭|閬|垮|瘨|鍘|诲|摢|鍐|宀|瀬|鑸|掗|€/.test(text)) return true;
  return false;
}

function isUsefulPreference(item) {
  const title = String(item?.title || "").trim();
  const detail = String(item?.detail || "").trim();
  if (isBadPreferenceText(title) || isBadPreferenceText(detail)) return false;
  const noTags = !Array.isArray(item.tags) || item.tags.length === 0;
  if ((item.source || "") === "chat" && (item.type || "general") === "general" && noTags && title === detail && /[?？]$/.test(title)) return false;
  return true;
}

function usefulPreferences(limit = Infinity) {
  const seen = new Set();
  return state.preferences.filter(isUsefulPreference).filter((item) => {
    const key = `${item.type || "general"}|${String(item.title || "").trim()}|${String(item.detail || "").trim()}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function profileAffinity() {
  const metrics = preferenceMetrics().map(([, value]) => value);
  return Math.round(metrics.reduce((sum, value) => sum + value, 0) / Math.max(metrics.length, 1));
}

function destinationPreferenceReason(destination) {
  if (destination.reason) return destination.reason;
  const metrics = preferenceMetrics().sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  const tags = destination.tags || [];
  const matched = metrics.filter((name) => tags.some((tag) => String(tag).includes(name)));
  const used = matched.length ? matched : metrics;
  return `匹配你的${used.join("、")}偏好，按画像权重 ${profileAffinity()}% 参与排序`;
}

function destinationMatchScore(destination) {
  const tags = `${destination.summary || ""} ${destination.intro || ""} ${(destination.tags || []).join(" ")}`;
  return preferenceMetrics().reduce((score, [name, value]) => {
    return tags.includes(name) ? score + value : score + Math.round(value * 0.08);
  }, Number(destination.score || destination.weight || 0));
}

function travelFootprint() {
  const records = state.tripRecords.length ? state.tripRecords : bootstrap.tripRecords || [];
  const destinationsVisited = new Set(records.map((record) => record.destination).filter(Boolean)).size;
  return { records: records.length, destinations: destinationsVisited };
}

function sideTripSummary() {
  const plan = state.plans[0];
  if (plan) {
    return {
      title: plan.title || `${plan.destination || "未命名目的地"}行程`,
      meta: `${plan.days?.length || plan.days || 0} 天 · ${plan.pace || plan.budget || "规划中"}`,
    };
  }
  const record = (state.tripRecords.length ? state.tripRecords : bootstrap.tripRecords || [])[0];
  if (record) {
    return {
      title: `${record.destination}旅行记忆`,
      meta: `${record.date || "未设置日期"} · ${record.mood || "已记录"}`,
    };
  }
  return { title: "还没有行程", meta: "新建后会在这里显示" };
}

function endpointStatusRows() {
  const publicSettings = bootstrap.settingsPublic || {};
  return [
    ["auth/login", state.currentUser ? "已登录" : "可用"],
    ["destinations/recommend", state.recommendationsLoaded ? "已同步" : "待刷新"],
    ["trips/plans", state.plansLoaded ? "已同步" : "待读取"],
    ["ai/chat", publicSettings.ai?.deepseekConfigured ? "DeepSeek" : "待配置"],
    ["preferences/list", `${state.preferences.length} 条`],
    ["admin/settings", publicSettings.map?.configured || publicSettings.unsplash?.configured ? "已配置" : "待配置"],
    ["admin/users", `${state.users.length} 位`],
  ];
}

function isAdmin() {
  return state.currentUser?.role === "admin";
}

function themeSwitch() {
  const isLight = state.theme === "light";
  return `<button class="theme-switch ${isLight ? "is-light" : ""}" data-action="toggleTheme" aria-label="${isLight ? "切换到夜间模式" : "切换到日间模式"}" aria-pressed="${isLight}">
    <span class="theme-icon theme-moon">${icon("moon")}</span>
    <span class="theme-icon theme-sun">${icon("sun")}</span>
    <span class="theme-label">${isLight ? "夜间模式" : "日间模式"}</span>
  </button>`;
}

function mobileTabbar() {
  const items = [...navItems, ["/settings", "设置", "settings"]];
  return `<nav class="mobile-tabbar" aria-label="移动端主导航">
    <div class="mobile-tabbar-inner">
      ${items.map(([route, label, iconName]) => `<button class="mobile-tab ${state.route === route ? "on" : ""}" data-action="go" data-route="${esc(route)}" aria-label="${esc(label)}" aria-current="${state.route === route ? "page" : "false"}">
        ${icon(iconName)}
        <span>${esc(label)}</span>
      </button>`).join("")}
    </div>
  </nav>`;
}

function header(title, sub, right = "") {
  return `<header class="header">
    <div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
    <div class="header-actions">${right}</div>
  </header>`;
}

function shell(content) {
  const nav = navItems.map(([route, label, iconName]) => button(label, "go", {
    cls: `navbtn ${state.route === route ? "on" : ""}`,
    route,
    icon: iconName,
  })).join("");
  const sideTrip = sideTripSummary();
  return `<div class="${state.theme === "light" ? "light " : ""}shell">
    <aside class="side">
      ${button("<b>拾光旅图</b><small>SHIGUANG TRAVEL VISION</small>", "go", { cls: "brand", route: "/" })}
      <nav class="nav">${nav}</nav>
      <div class="side-card">
        <small>我的行程</small>
        <b>${esc(sideTrip.title)}</b>
        <span>${esc(sideTrip.meta)}</span>
        ${button("新建行程", "go", { route: "/planner", icon: "plus" })}
      </div>
      <div class="sidefoot">
        ${button("<b>旅行者</b><small>个人客户端</small>", "go", { cls: "user", route: "/profile" })}
        <div class="side-theme">${themeSwitch()}</div>
        ${button("设置", "go", { route: "/settings" })}
      </div>
    </aside>
    <main class="workspace">${content}</main>
    ${mobileTabbar()}
    ${toastStack()}
  </div>`;
}

function toastStack() {
  if (!state.toasts.length) return "";
  return `<div class="toast-stack" role="status">${state.toasts.map((item) => `<div class="toast ${item.type}">${esc(item.text)}</div>`).join("")}</div>`;
}

function loadingDots(label = "加载中") {
  return `<span class="loading-dot" aria-label="${esc(label)}"><i></i><i></i><i></i></span>`;
}

function worldMap() {
  const publicSettings = bootstrap.settingsPublic || {};
  const configured = publicSettings.map?.configured;
  return `<div class="world-map ${configured ? "amap-ready" : "map-loaded"} layer-${esc(state.mapLayer)} ${state.mapPreferenceOnly ? "preference-filtered" : ""}"${configured ? "" : ' data-action="mapBackground"'}>
    <div id="amapCanvas" class="amap-canvas" aria-label="高德地图"></div>
    <div class="fallback-map">
      <div class="grid"></div>
      <div class="arc arc-one"></div><div class="arc arc-two"></div><div class="arc arc-three"></div>
      ${destinations.map((d, index) => `<button class="hot ${state.selectedId === d.id ? "on" : ""}" style="left:${12 + (index % 3) * 34}%;top:${24 + Math.floor(index / 3) * 32}%" data-action="selectDestination" data-id="${esc(d.id)}">
        <i></i><span>${esc(d.name)}</span>
      </button>`).join("")}
    </div>
    ${configured ? `<div class="map-loading-mask" role="status" aria-live="polite"><div class="map-loader-orbit"><i></i><i></i><i></i></div><b>正在展开世界地图</b><span>连接实时地图与目的地坐标…</span></div>` : ""}
  </div>`;
}

function memoryTravelMap(records) {
  const positions = {
    "厦门": [76, 60],
    "西安": [65, 48],
    "挪威": [49, 23],
    "冰岛": [39, 24],
    "瑞士": [51, 42],
    "摩洛哥": [47, 55],
    "新西兰": [84, 78],
    "葡萄牙": [43, 45],
    "大理": [68, 59],
  };
  const markers = (records || []).map((record, index) => {
    const name = record.destination || "旅行记忆";
    const found = Object.entries(positions).find(([key]) => name.includes(key));
    const [x, y] = found ? found[1] : [26 + (index % 4) * 16, 34 + Math.floor(index / 4) * 18];
    return { ...record, name, x, y };
  });
  const route = markers.length > 1 ? `<polyline class="memory-route" points="${markers.map((item) => `${item.x},${item.y}`).join(" ")}"/>` : "";
  return `<div class="memory-travel-map" aria-label="旅行足迹地图">
    <svg class="memory-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="memorySea" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="rgba(98,216,238,.16)"/>
          <stop offset="1" stop-color="rgba(126,240,187,.08)"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#memorySea)"/>
      <path class="memory-land" d="M6,38 C13,24 30,20 38,30 C45,39 36,52 25,50 C15,49 8,48 6,38Z"/>
      <path class="memory-land" d="M39,22 C52,13 67,18 73,32 C81,51 68,67 52,61 C41,57 36,38 39,22Z"/>
      <path class="memory-land" d="M68,48 C78,39 93,46 95,61 C98,80 83,88 72,77 C64,69 59,56 68,48Z"/>
      <path class="memory-land small" d="M81,76 C88,72 94,77 93,85 C91,94 82,93 78,86 C75,81 77,78 81,76Z"/>
      ${route}
      ${markers.map((item) => `<circle class="memory-pin-dot" cx="${esc(item.x)}" cy="${esc(item.y)}" r="1.6"/>`).join("")}
    </svg>
    <div class="memory-map-shade"></div>
    ${markers.map((item) => `<article class="memory-visited" style="left:${esc(item.x)}%;top:${esc(item.y)}%">
      <i></i><b>${esc(item.name)}</b><span>${esc(item.date || "")}${item.mood ? ` · ${esc(item.mood)}` : ""}</span>
    </article>`).join("")}
  </div>`;
}

function mapPopup() {
  if (!state.mapPopupOpen) return "";
  const d = activeMapPlace();
  const picked = Boolean(state.mapPickedPlace);
  return `<article class="map-popup ${state.popupSide} ${esc(d.img || "")}${state.planningTransition ? " is-planning" : ""}"${photoStyle(d)} style="--popup-top: ${state.popupTop}px">
    <div class="map-popup-media" aria-hidden="true">${destinationPhoto(d, "map-popup-photo")}</div>
    <button class="iconbtn close-map-popup" data-action="closeMapPopup" aria-label="关闭地点卡片">${icon("close")}</button>
    <div class="map-popup-body">
      <small>${esc(d.country)} · ${esc(d.region)} · ${esc(d.season)}</small>
      <h2>${esc(d.name)}</h2>
      <p>${esc(d.intro)}</p>
      <p class="reason">${esc(destinationPreferenceReason(d))}</p>
      ${tagrow([d.budget, `${d.days}天`, `${d.weight}% 匹配`])}
      <div class="actions">
        ${picked ? button("带去顾问", "askPickedPlace", { cls: "primary", icon: "spark" }) : button("规划这里", "planDestination", { cls: "primary", id: d.id, icon: "route" })}
        ${picked ? button("详情", "detailPickedPlace", { cls: "secondary", icon: "external" }) : button("详情", "go", { route: `/destination/${d.id}`, icon: "external" })}
        ${picked ? "" : button("想去", "wish", { id: d.id, icon: "heart" })}
        ${picked ? "" : button("避开", "dismiss", { id: d.id, icon: "filter" })}
      </div>
    </div>
    ${state.planningTransition ? `<div class="map-loading"><span>${loadingDots("正在进入规划")}</span><b>正在读取图片和偏好，生成规划画面</b></div>` : ""}
  </article>`;
}

function aiDock() {
  const chips = ["春节避寒去哪？", "10天欧洲小众路线", "亲子海岛度假推荐", "拍极光的最佳地点"].map((text) => chip(text, "sendAi", false, { text })).join("");
  const draft = esc(state.advisorDraft || "");
  const messages = state.messages.map((m) => `<article class="msg ${m.role}">
    <span class="msg-avatar">${m.role === "user" ? "你" : "AI"}</span>
    <div class="msg-body">
      <small>${m.role === "user" ? "你的偏好" : "旅行顾问"}</small>
      <p>${esc(m.text)}</p>
    </div>
  </article>`).join("");
  const messageList = messages || `<div class="msg-empty">说出预算、天数或想避开的坑，我会把它们整理进你的旅行画像。</div>`;
  const jumpClass = state.messages.length && !state.aiStickToBottom ? " show" : "";
  return `<section class="ai-dock ${state.aiExpanded ? "open" : ""}">
    ${state.aiExpanded ? `<div class="ai-top"><div><b>AI 旅行顾问</b><small>偏好会写入个人画像</small></div>${button("收缩", "collapseAi", { cls: "ghost compact", icon: "close" })}</div>
      <div class="msgs-wrap">
        <div class="msgs" role="log" aria-live="polite">${messageList}</div>
        <button class="scroll-latest${jumpClass}" data-action="scrollAiBottom" aria-label="回到最新消息">${icon("chevronDown")}</button>
      </div>` : ""}
    <div class="airow">
      <span class="orb"></span>
      <textarea id="mapAiInput" rows="1" placeholder="告诉我你的预算、时间和想靠近的风景">${draft}</textarea>
      ${button("", "sendAi", { cls: "send", icon: state.loading.ai ? "spinner" : "plane", iconClass: state.loading.ai ? "spin" : "", disabled: state.loading.ai || !draft, aria: state.loading.ai ? "AI 正在回复" : "发送" })}
    </div>
    ${state.aiExpanded ? `<div class="chips ai-chips">${chips}</div>` : ""}
  </section>`;
}

function formatChatTime(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "刚刚" : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function chatTitle(messages = state.messages) {
  const first = messages.find((item) => item.role === "user")?.text || "新的旅行对话";
  return first.length > 18 ? `${first.slice(0, 18)}...` : first;
}

function persistChat() {
  writeJson("shiguang-ai-current", state.messages);
  if (!state.messages.length) return;
  const now = new Date().toISOString();
  const session = {
    id: state.currentChatId || `chat_${Date.now()}`,
    title: chatTitle(),
    preview: state.messages[state.messages.length - 1]?.text || "",
    count: state.messages.length,
    updatedAt: now,
    messages: state.messages,
  };
  state.currentChatId = session.id;
  state.chatSessions = [session, ...state.chatSessions.filter((item) => item.id !== session.id)].slice(0, 30);
  writeJson("shiguang-ai-sessions", state.chatSessions);
}

function latestAssistantMessage() {
  return [...state.messages].reverse().find((item) => item.role === "assistant");
}

function advisorActionDestination() {
  const text = `${state.messages.map((item) => item.text).join(" ")} ${latestAssistantMessage()?.text || ""}`;
  // 尝试在对话中匹配已有目的地
  const matched = destinations.find((destination) => text.includes(destination.name) || text.includes(destination.country) || text.includes(destination.region));
  if (matched) return matched;
  // 尝试从对话中提取地名关键词（常见模式）
  const patterns = [
    /(?:去|到|前往|目的地[是为]?|规划|安排|搜索)(?:一下|一个|一趟)?[“"「]?([\u4e00-\u9fff]{2,8})[”"」]?/g,
    /([\u4e00-\u9fff]{2,6})(?:怎么样|如何|好玩|值得去|攻略|行程|旅行)/g,
    /(?:想|要|准备|打算|计划)(?:去|到|前往)[“"「]?([\u4e00-\u9fff]{2,8})[”"」]?/g,
  ];
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const m of matches) {
      const candidate = m[1];
      // 过滤常见非地名词汇
      if (!/^(?:一个|一下|一趟|那里|这里|那边|这边|哪个|哪里|什么|怎么|如何|可以|能够|应该|需要|这个|那个)$/.test(candidate)) {
        return { id: '', name: candidate, country: '', region: '', tags: [], budget: '', season: '', days: 1, intro: '', summary: '', img: '', weight: 0, lat: 0, lng: 0 };
      }
    }
  }
  // 最后回退：取用户最后一条消息中的关键片段
  const userMessages = state.messages.filter(m => m.role === "user");
  if (userMessages.length) {
    const lastMsg = userMessages[userMessages.length - 1].text;
    const trimmed = lastMsg.replace(/[?？!！。，,、\s]/g, '').slice(0, 12);
    if (trimmed) {
      return { id: '', name: trimmed, country: '', region: '', tags: [], budget: '', season: '', days: 1, intro: '', summary: '', img: '', weight: 0, lat: 0, lng: 0 };
    }
  }
  return selectedDestination();
}

function advisorMessageActions(message, index) {
  if (message.role !== "assistant") return "";
  const isLatestAssistant = state.messages.findLastIndex?.((item) => item.role === "assistant") === index
    || index === state.messages.map((item) => item.role).lastIndexOf("assistant");
  if (!isLatestAssistant) return "";
  const destination = advisorActionDestination();
  return `<div class="advisor-message-actions">
    ${button("生成规划", "advisorPlan", { cls: "ghost compact", id: destination.id, icon: "route" })}
    ${button("加入旅行记忆", "advisorMemory", { cls: "ghost compact", id: destination.id, icon: "book" })}
    ${button("收藏目的地", "wish", { cls: "ghost compact", id: destination.id, icon: "heart" })}
  </div>`;
}

function advisorMessages() {
  const messages = state.messages.map((m, index) => {
    const isLatestAssistant = m.role === "assistant" && index === state.messages.length - 1;
    const isLatestStreaming = isLatestAssistant && state.loading.ai;
    // Show Dify workflow progress as a rounded card at the top of the latest AI message
    const progressHtml = (isLatestAssistant && state.workflowProgress.type === "chat" && (state.workflowProgress.visible || state.workflowProgress.status === "completed" || state.workflowProgress.status === "error"))
      ? renderChatWorkflowCard()
      : "";
    return `<article class="advisor-msg ${m.role}">
      <div class="advisor-avatar" aria-hidden="true">${m.role === "user" ? "你" : icon("spark")}</div>
      <div class="advisor-bubble${isLatestStreaming ? " typing" : ""}">${progressHtml}<p>${esc(m.text)}</p>${advisorMessageActions(m, index)}</div>
    </article>`;
  }).join("");
  return messages || `<div class="advisor-empty"><b>今天想怎么走？</b><span>告诉我预算、天数、城市、喜欢的风景或想避开的坑，我会按聊天记忆继续规划。</span></div>`;
}

/**
 * 渲染聊天消息顶部的 Dify 工作流圆角卡片（紧凑水平布局）
 */
function renderChatWorkflowCard() {
  const { steps, status, fallback } = state.workflowProgress;
  if (!steps.length) return "";

  const isRunning = status === "running";
  const isDone = status === "completed";
  const hasFailed = status === "error";
  const expanded = state.chatWorkflowExpanded !== false; // 默认展开

  // 显示规则：所有 completed/running + 下一个 pending（折叠时）/ 更多 pending（展开时）
  const doneOrRunning = steps.filter(s => s.status === "completed" || s.status === "running");
  const pendingCount = steps.filter(s => s.status === "pending").length;
  
  let visibleSteps;
  if (expanded) {
    // 展开：显示所有 completed/running + 最多 8 个 pending
    visibleSteps = [...doneOrRunning, ...steps.filter(s => s.status === "pending").slice(0, 8)];
  } else {
    // 折叠：显示所有 completed/running + 最多 2 个 pending
    visibleSteps = [...doneOrRunning, ...steps.filter(s => s.status === "pending").slice(0, 2)];
  }

  // 确保至少有一个步骤
  if (visibleSteps.length === 0 && steps.length > 0) visibleSteps.push(steps[0]);

  const chipHtml = visibleSteps.map(s => {
    let iconSvg = "";
    let cls = `wf-chip ${s.status}`;
    if (s.status === "completed") {
      iconSvg = `<svg width="10" height="10" viewBox="0 0 16 16"><polyline points="3 8 6.5 12 13 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (s.status === "running") {
      iconSvg = `<span class="ws-spinner" style="width:10px;height:10px;border-width:1.5px"></span>`;
    } else if (s.status === "failed") {
      iconSvg = `<svg width="10" height="10" viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    }
    const duration = s.duration ? ` <small class="wf-chip-duration">${s.duration}</small>` : "";
    const tokens = s.tokens ? ` <small class="wf-chip-tokens">${s.tokens}</small>` : "";
    return `<span class="${cls}" data-key="${esc(s.key)}">${iconSvg}${esc(s.label)}${duration}${tokens}</span>`;
  }).join("");

  const totalDone = steps.filter(s => s.status === "completed").length;
  const hiddenCount = steps.length - visibleSteps.length;
  
  // 状态摘要
  let summary;
  if (isDone) {
    summary = `Dify 已处理 ${totalDone}/${steps.length} 步`;
  } else if (hasFailed) {
    summary = 'Dify 工作流出错';
  } else {
    // 实时显示当前正在运行的步骤名
    const runningStep = steps.find(s => s.status === "running");
    summary = runningStep
      ? `${runningStep.label}… ${totalDone}/${steps.length}`
      : `Dify 处理中 ${totalDone}/${steps.length}`;
  }

  const statusBadge = isDone ? `<span class="wf-badge done">✓</span>`
    : hasFailed ? `<span class="wf-badge error">!</span>`
    : `<span class="wf-badge running"><span class="ws-spinner" style="width:10px;height:10px;border-width:1.5px"></span></span>`;

  // 折叠/展开按钮
  const toggleIcon = expanded
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 15 12 9 18 15"/></svg>`;
  const toggleBtn = `<button class="wf-toggle" data-action="toggleChatWorkflow" aria-label="${expanded ? '折叠' : '展开'}进度详情">${toggleIcon} ${hiddenCount > 0 ? `+${hiddenCount}` : ''}</button>`;

  return `<div class="wf-message-card ${status}${expanded ? ' expanded' : ' collapsed'}" id="wf-chat-card">
    <div class="wf-card-head">
      ${statusBadge}
      <span class="wf-card-summary">${summary}</span>
      ${fallback ? `<span class="wf-fallback">${esc(fallback)}</span>` : ""}
      ${toggleBtn}
    </div>
    <div class="wf-card-steps">${chipHtml}</div>
  </div>`;
}

/**
 * 实时更新聊天消息中的 workflow 卡片 DOM（不重新渲染整个消息列表）
 */
function updateChatWorkflowCardDom() {
  const cardEl = document.getElementById("wf-chat-card");
  if (!cardEl) return;
  const { steps, status, fallback } = state.workflowProgress;
  if (!steps.length) return;

  const expanded = state.chatWorkflowExpanded !== false;
  const isRunning = status === "running";
  const isDone = status === "completed";
  const hasFailed = status === "error";
  
  const doneOrRunning = steps.filter(s => s.status === "completed" || s.status === "running");
  let visibleSteps;
  if (expanded) {
    visibleSteps = [...doneOrRunning, ...steps.filter(s => s.status === "pending").slice(0, 8)];
  } else {
    visibleSteps = [...doneOrRunning, ...steps.filter(s => s.status === "pending").slice(0, 2)];
  }
  if (visibleSteps.length === 0 && steps.length > 0) visibleSteps.push(steps[0]);

  // Update chips
  const stepsEl = cardEl.querySelector(".wf-card-steps");
  if (stepsEl) {
    stepsEl.innerHTML = visibleSteps.map(s => {
      let iconSvg = "";
      let cls = `wf-chip ${s.status}`;
      if (s.status === "completed") {
        iconSvg = `<svg width="10" height="10" viewBox="0 0 16 16"><polyline points="3 8 6.5 12 13 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      } else if (s.status === "running") {
        iconSvg = `<span class="ws-spinner" style="width:10px;height:10px;border-width:1.5px"></span>`;
      } else if (s.status === "failed") {
        iconSvg = `<svg width="10" height="10" viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
      }
      const duration = s.duration ? ` <small class="wf-chip-duration">${s.duration}</small>` : "";
      const tokens = s.tokens ? ` <small class="wf-chip-tokens">${s.tokens}</small>` : "";
      return `<span class="${cls}" data-key="${esc(s.key)}">${iconSvg}${esc(s.label)}${duration}${tokens}</span>`;
    }).join("");
  }

  // Update summary
  const summaryEl = cardEl.querySelector(".wf-card-summary");
  if (summaryEl) {
    const totalDone = steps.filter(s => s.status === "completed").length;
    const runningStep = steps.find(s => s.status === "running");
    if (isDone) {
      summaryEl.textContent = `Dify 已处理 ${totalDone}/${steps.length} 步`;
    } else if (hasFailed) {
      summaryEl.textContent = 'Dify 工作流出错';
    } else if (runningStep) {
      summaryEl.textContent = `${runningStep.label}… ${totalDone}/${steps.length}`;
    } else {
      summaryEl.textContent = `Dify 处理中 ${totalDone}/${steps.length}`;
    }
  }

  // Update card class
  cardEl.className = `wf-message-card ${status}${expanded ? ' expanded' : ' collapsed'}`;

  // Fallback
  const fbEl = cardEl.querySelector(".wf-fallback");
  if (fbEl) {
    fbEl.textContent = fallback || "";
    fbEl.style.display = fallback ? "" : "none";
  }

  // Toggle button text
  const toggleEl = cardEl.querySelector(".wf-toggle");
  if (toggleEl) {
    const hiddenCount = steps.length - visibleSteps.length;
    const svgUp = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const svgDown = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 15 12 9 18 15"/></svg>`;
    toggleEl.innerHTML = `${expanded ? svgUp : svgDown} ${hiddenCount > 0 ? `+${hiddenCount}` : ''}`;
  }
}

function advisorSuggestionCards() {
  return destinations.slice(0, 3).map((d) => `<article class="advisor-suggestion">
    <div>
      <b>${esc(d.name)}</b>
      <span>${esc(d.summary)}</span>
      <small>${esc(d.weight)}% 匹配</small>
    </div>
    <div class="advisor-suggestion-actions">
      ${button("规划", "advisorPlan", { cls: "ghost compact", id: d.id, icon: "route" })}
      ${button("记忆", "advisorMemory", { cls: "ghost compact", id: d.id, icon: "book" })}
      ${button("想去", "wish", { cls: "ghost compact", id: d.id, icon: "heart" })}
    </div>
  </article>`).join("");
}

function advisorHistory() {
  const sessions = state.chatSessions.map((item) => `<button class="history-item" data-action="loadChatSession" data-id="${esc(item.id)}">
    <b>${esc(item.title || "旅行对话")}</b>
    <span>${esc(item.preview || "暂无摘要")}</span>
    <small>${esc(formatChatTime(item.updatedAt))} · ${esc(item.count || 0)} 条</small>
  </button>`).join("");
  return `<aside class="advisor-history ${state.chatHistoryOpen ? "open" : ""}">
    <div class="history-head"><b>历史聊天</b>${button("", "toggleChatHistory", { cls: "iconbtn", icon: "close", aria: "关闭历史聊天" })}</div>
    <div class="history-list">${sessions || `<div class="history-empty">还没有历史聊天。</div>`}</div>
  </aside>`;
}

function advisorChat() {
  const chips = ["春节避寒去哪？", "10天欧洲小众路线", "亲子海岛度假推荐", "拍极光的最佳地点"].map((text) => chip(text, "sendAi", false, { text })).join("");
  const draft = esc(state.advisorDraft || "");
  return `<section class="advisor-chat">
    <div class="advisor-top">
      <div><b>AI 旅行顾问</b><small>偏好会写入个人画像</small></div>
      <div class="advisor-actions">
        ${button("新对话", "newChatSession", { cls: "ghost compact", icon: "plus" })}
        ${button("历史", "toggleChatHistory", { cls: "ghost compact", icon: "history" })}
      </div>
    </div>
    <div class="advisor-body">
      <div class="msgs advisor-msgs" role="log" aria-live="polite">${advisorMessages()}</div>
      <button class="scroll-latest${state.messages.length && !state.aiStickToBottom ? " show" : ""}" data-action="scrollAiBottom" aria-label="回到最新消息">${icon("chevronDown")}</button>
    </div>
    <div class="advisor-composer">
      ${button("", "imageVision", { cls: "vision-btn", icon: "image", aria: "图片识别接口预留" })}
      <textarea id="aiInput" rows="1" placeholder="告诉我你的预算、时间和想靠近的风景">${draft}</textarea>
      ${button("", "sendAi", { cls: "send", icon: state.loading.ai ? "spinner" : "plane", iconClass: state.loading.ai ? "spin" : "", disabled: state.loading.ai || !draft, aria: state.loading.ai ? "AI 正在回复" : "发送" })}
    </div>
    <div class="chips ai-chips">${chips}</div>
    ${advisorHistory()}
  </section>`;
}

function exploreRecommendationItems() {
  return [...destinations].sort((a, b) => destinationMatchScore(b) - destinationMatchScore(a));
}

function exploreRecommendationCards() {
  return exploreRecommendationItems().map((item) => `<article class="recommend-card image-card ${esc(item.img || "")}" data-action="selectDestination" data-id="${esc(item.id)}"${photoStyle(item)}>
    ${destinationPhoto(item, "recommend-photo")}
    <div class="recommend-copy"><small>${esc(item.score || item.weight)}% 匹配 · ${esc(item.budget)}</small><h3>${esc(item.name)}</h3><p>${esc(destinationPreferenceReason(item))}</p></div>
  </article>`).join("");
}

function refreshExploreMediaSurfaces() {
  const strip = document.querySelector(".rec-strip");
  if (strip) strip.innerHTML = exploreRecommendationCards();
  refreshMapPopup();
}

function explore() {
  const d = selectedDestination();
  const publicSettings = bootstrap.settingsPublic || {};
  const mapStatus = publicSettings.map?.configured ? "高德地图已接入" : "等待填写高德 JS Key";
  const aiStatus = publicSettings.ai?.deepseekConfigured ? "DeepSeek 已配置" : "DeepSeek 待配置";
  const footprint = travelFootprint();
  const recs = exploreRecommendationCards();
  const tools = [
    ["签证查询", "国家移民管理局", "https://www.nia.gov.cn/"],
    ["航班追踪", "航旅纵横", "https://www.umetrip.com/"],
    ["汇率换算", "中国银行外汇牌价", "https://www.boc.cn/sourcedb/whpj/"],
    ["天气预报", "中国天气", "https://www.weather.com.cn/"],
    ["安全提醒", "领事直通车", "https://cs.mfa.gov.cn/"],
    ["拍摄电压", "维基旅行电源参考", "https://en.wikivoyage.org/wiki/Electrical_systems"],
  ].map(([label, source, url]) => `<a class="quick-tool" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon("external")}<b>${esc(label)}</b><span>${esc(source)}</span></a>`).join("");
  return shell(`<section class="explore">
    <div class="maphero ${state.mapImmersive ? "immersive" : ""} ${state.heroDismissed ? "hero-faded" : ""}">
      <div class="hero-toolbar">
        <span class="mode-pill">${icon("compass")}探索模式</span>
        <div class="status-pills">
          <span>${icon("plane")} 实时航班 <i class="okdot"></i></span>
          <span>签证提示 <b>3</b></span>
          <span>汇率 1 CNY ≈ 0.139 USD</span>
        </div>
      </div>
      ${worldMap()}
      <div class="hero-copy">
        <h1>把世界摊开，<br>挑一个今天想靠近的地方。</h1>
      </div>
      ${mapPopup()}
      ${aiDock()}
      <div class="coord">23.1291°N，113.2644°E</div>
    </div>
    <section class="below-hero">
      <div>
        ${panelTitle("为你推荐", "由画像和实时偏好排序")}
        <div class="rec-strip">${recs}</div>
      </div>
      <aside class="rail">
        <article class="panel profile-card">
          ${panelTitle("个人画像", "完整档案")}
          <div class="ring"><b>${profileAffinity()}%</b><span>旅行契合度</span></div>
          <p>旅行足迹：${footprint.records} 条记录 / ${footprint.destinations} 个目的地</p>
          <div class="mini-world"></div>
        </article>
        <article class="panel">
          ${panelTitle("接口状态", "真实服务优先")}
          <div class="profile-row"><span>地图服务</span><small>${esc(mapStatus)}</small></div>
          <div class="profile-row"><span>AI 对话</span><small>${esc(aiStatus)}</small></div>
          <div class="profile-row"><span>图片服务</span><small>${publicSettings.media?.apihzBaiduConfigured ? "百度+搜狗源已配置" : publicSettings.unsplash?.configured ? "Unsplash 已配置" : "图片源待配置"}</small></div>
        </article>
        <article class="panel quick-tools">
          ${panelTitle("快速工具")}
          ${tools}
        </article>
      </aside>
    </section>
  </section>`);
}

function advisor() {
  return shell(header("AI 旅行顾问", "接入 DeepSeek、豆包或 OpenAI 兼容接口，偏好会写入个人画像。") + `<div class="grid2">
    <div class="panel ai-panel">${aiDock()}</div>
    <aside class="panel">${panelTitle("可执行建议", "来自当前偏好")}
      ${destinations.slice(0, 3).map((d) => `<div class="profile-row"><span><b>${esc(d.name)}</b><br><span class="muted">${esc(d.summary)}</span></span><small>${esc(d.weight)}%</small></div>`).join("")}
      <div class="notice">聊天中的预算、节奏、喜欢和避雷点会进入画像，确认后参与推荐加权。</div>
    </aside>
  </div>`);
}

function advisorPage() {
  return shell(header("AI 旅行顾问", "接入 DeepSeek、豆包或 OpenAI 兼容接口，偏好会写入个人画像。") + `<div class="advisor-layout">
    ${advisorChat()}
    <aside class="panel advisor-suggest">${panelTitle("可执行建议", "来自当前偏好")}
      <div class="advisor-suggestion-list">${advisorSuggestionCards()}</div>
      <div class="notice">聊天中的预算、节奏、喜欢和避雷点会进入画像，确认后参与推荐加权。</div>
    </aside>
  </div>`);
}

function planGeneratingPreview(destination, count, budget, pace) {
  const terms = [
    "读取画像偏好", "拆分每日主题", "匹配交通半径", "安排主体验", "预留天气备选", "核对预算节奏",
    "生成上午词条", "生成下午词条", "生成晚间提醒", "准备导出结构",
  ];
  const dayCards = Array.from({ length: Math.min(Math.max(count, 1), 6) }, (_, index) => `<article class="day plan-loading-day" style="--delay:${index * 0.08}s">
    <small>DAY ${index + 1}</small>
    <h3><i></i><span></span></h3>
    <p><b>上午</b><span></span></p>
    <p><b>下午</b><span></span></p>
    <p><b>晚上</b><span></span></p>
  </article>`).join("");
  return `<div class="plan-generating" aria-live="polite">
    ${panelTitle(`${esc(destination)} ${esc(count)} 日行程`, "AI 正在生成")}
    <p class="muted">${esc(pace)}节奏 · ${esc(budget)}预算 · 正在把聊天偏好拆成可执行日程。</p>
    <div class="plan-loading-terms">${terms.map((term, index) => `<span style="--delay:${index * 0.1}s">${esc(term)}</span>`).join("")}</div>
    <div class="timeline">${dayCards}</div>
  </div>`;
}

function planner() {
  const p = state.plans[0] || defaultPlan();
  const draft = state.loading.plan ? state.planningDraft : null;
  const plannerDestination = draft?.destination || state.pendingPlanDestination || p.destination || "";
  const plannerDays = draft?.count || p.days?.length || p.days || 5;
  const plannerBudget = draft?.budget || p.budget || "均衡";
  const plannerPace = draft?.pace || p.pace || "慢游";
  const tags = ["美食", "自然", "人文", "摄影", "亲子", "购物", "小众", "夜生活"].map((tag) => chip(tag, "togglePlannerTag", state.plannerTags.includes(tag))).join("");
  return shell(header("行程规划", "生成可导出、可加入日历、能落地执行的每日路线。", button(state.loading.planHistory ? loadingDots("读取历史规划") : "读取历史规划", "loadTripPlans", { icon: "route", disabled: state.loading.planHistory })) + `<div class="grid2">
    <section class="panel form">
      ${panelTitle("生成条件", state.loading.plan ? "生成中" : "实时预览")}
      <label>目的地<input id="pd" value="${esc(plannerDestination)}"></label>
      <label>去几天<input id="days" type="number" min="1" max="14" value="${esc(plannerDays)}"></label>
      <label>预算<input id="budget" value="${esc(plannerBudget)}"></label>
      <label>旅行节奏<input id="pace" value="${esc(plannerPace)}"></label>
      <div class="chips">${tags}</div>
      ${button(state.loading.plan ? loadingDots("正在生成行程") : "生成行程", "makePlan", { cls: "primary full", disabled: state.loading.plan })}
    </section>
    <section class="panel plan-preview">
      ${state.loading.plan ? (state.workflowProgress.visible ? renderWorkflowStepper() + planGeneratingPreview(plannerDestination, Number(plannerDays) || 5, plannerBudget, plannerPace) : planGeneratingPreview(plannerDestination, Number(plannerDays) || 5, plannerBudget, plannerPace)) : `${panelTitle(p.title, `预算约 ¥${p.estimate}`)}
      <p class="muted">${esc(p.overview)}</p>
      <div class="timeline">${(p.days || []).map((day, index) => planDay(day, index)).join("")}</div>
      <div class="actions">${button("导出文本", "exportPlan", { icon: "download" })}${button("加入日历", "addCalendar", { icon: "calendar" })}</div>`}
    </section>
  </div>${planHistoryModal()}`);
}

function defaultPlan() {
  return { title: "行程待生成", destination: "", budget: "", pace: "", estimate: 0, overview: "请填写目的地和天数，点击「生成行程」由 Dify 工作流或 AI 引擎生成结构化行程。", days: [] };
}

function planDay(day, index) {
  const title = typeof day === "string" ? day : day.title || `第 ${index + 1} 天`;
  const morning = typeof day === "string" ? "慢早餐 + 主区域进入" : day.morning || day.am || "慢早餐 + 主区域进入";
  const afternoon = typeof day === "string" ? "核心体验 + 备选点" : day.afternoon || day.pm || "核心体验 + 备选点";
  const evening = typeof day === "string" ? "本地餐厅 + 夜间散步" : day.evening || day.night || "本地餐厅 + 夜间散步";
  const notes = typeof day === "string" ? "" : day.notes || "";
  return `<article class="day"><small>DAY ${index + 1}</small><h3>${esc(title)}</h3><p><b>上午</b><span>${esc(morning)}</span></p><p><b>下午</b><span>${esc(afternoon)}</span></p><p><b>晚上</b><span>${esc(evening)}</span></p>${notes ? `<p><b>提醒</b><span>${esc(notes)}</span></p>` : ""}</article>`;
}

function normalizePlan(plan, index = 0) {
  if (!plan || typeof plan !== "object") {
    plan = { destination: "", days: [], daysCount: 0, budget: "", pace: "", title: "行程", estimate: 0, overview: "待生成", highlights: [], packingTips: "", provider: "fallback", fallback: true };
  }
  const dayCount = Number(plan.daysCount || (Array.isArray(plan.days) ? plan.days.length : plan.days) || 5);
  const days = Array.isArray(plan.days)
    ? plan.days
    : Array.from({ length: Math.max(1, dayCount) }, (_, dayIndex) => dayIndex === 0 ? "抵达与城市初识" : dayIndex === dayCount - 1 ? "收束与伴手礼" : "深度探索");
  return {
    ...plan,
    id: plan.id || `plan_${Date.now()}_${index}`,
    daysCount: days.length || dayCount,
    days,
    updatedAt: plan.updatedAt || new Date().toISOString(),
  };
}

function savePlanToHistory(plan) {
  const entry = normalizePlan({ ...plan, updatedAt: new Date().toISOString() });
  state.planHistory = [entry, ...state.planHistory.filter((item) => item.id !== entry.id)].slice(0, 30);
  writeJson("shiguang-trip-plans", state.planHistory);
}

function planHistoryModal() {
  if (!state.planHistoryOpen) return "";
  const items = state.planHistory.map((plan) => `<button class="plan-history-item" data-action="selectTripPlan" data-id="${esc(plan.id)}">
    <b>${esc(plan.title || "未命名行程")}</b>
    <span>${esc(plan.destination || "目的地")} · ${esc(plan.daysCount || plan.days?.length || 0)} 天 · ${esc(plan.pace || plan.budget || "规划")}</span>
    <small>${esc(plan.overview || "暂无摘要")}</small>
  </button>`).join("");
  return `<div class="modal-backdrop" data-action="closeTripHistory">
    <section class="modal plan-history-modal" role="dialog" aria-modal="true" aria-label="选择历史规划" data-action="modalStay">
      <div class="modal-head"><div><b>选择历史规划</b><small>选择一次历史行程并加载到右侧结果</small></div>${button("", "closeTripHistory", { cls: "iconbtn", icon: "close", aria: "关闭历史规划" })}</div>
      <div class="plan-history-list">${items || `<div class="history-empty">还没有历史规划。先生成一次行程，这里会保存记录。</div>`}</div>
    </section>
  </div>`;
}

function memories() {
  const records = state.tripRecords.length ? state.tripRecords : bootstrap.tripRecords || [];
  const memoryItems = usefulPreferences(4);
  return shell(header("旅行记忆", "让过去的路，帮你筛掉下一次的重复。") + `<div class="grid2">
    <div class="panel memory-map">${memoryTravelMap(records)}</div>
    <aside class="panel memory-impact">${panelTitle("AI 记忆影响", memoryItems.length ? "已过滤异常记录" : "暂无可用记忆")}
      ${memoryItems.length ? memoryItems.map((item) => `<article class="memory-impact-row"><div><b>${esc(item.title)}</b><span>${esc(item.detail)}</span></div><small>${esc(item.status || "pending")}</small></article>`).join("") : emptyState("暂无可展示的 AI 记忆", "已自动隐藏乱码、单字符和问号串记录。")}
    </aside>
  </div>
  <div class="grid3 spaced memory-photo-grid">${records.map(recordMemoryCard).join("")}</div>`);
}

function recommend() {
  const filters = ["经济实惠", "小众", "免签/友好", "周末短途", "自然风景", "人文历史", "美食"].map((item) => chip(item, "toggleRecommendFilter", state.recommendFilters.includes(item))).join("");
  const cards = state.loading.recommend ? recommendSkeletonCards() : visibleRecommendations().map((item) => recommendCard(item)).join("");
  const report = state.preferenceReport;
  const reportLine = report ? `<div class="notice recommend-report"><b>${esc(report.title || "偏好报告")}</b><span>${esc(report.summary || "")}</span><small>${esc(report.generatedAt ? `生成于 ${formatChatTime(report.generatedAt)} · ${report.trigger || "read"}` : "")}</small></div>` : "";
  return shell(header("推荐好地方", "好地方要来，但不是热门套路。", button(state.loading.recommend ? loadingDots("刷新推荐") : "刷新推荐", "loadRecommendations", { icon: "star", disabled: state.loading.recommend })) + `<div class="chips toolbar">${filters}</div>${state.loading.recommend ? recommendLoading() : reportLine}<div class="recgrid">${cards || emptyState("没有匹配项", "减少筛选条件，或者先在 AI 顾问里表达新的偏好。")}</div>`);
}

function recommendSkeletonCards() {
  return Array.from({ length: 3 }, () => `<article class="card rec-card skeleton-card rec-skeleton"><div class="cardimg media-skeleton"></div><div class="rec-body skeleton-stack"><span class="skeleton-line short"></span><span class="skeleton-line wide"></span><span class="skeleton-line"></span><span class="skeleton-line short"></span></div></article>`).join("");
}

function recommendLoading() {
  return `<div class="detail-loading"><div><b>正在重建偏好报告与推荐地点</b><span>后端会扫描偏好数据库，为当前用户重新排序并写入本地报告缓存。</span></div><i></i></div>`;
}

function recommendationSource() {
  // 优先用后端动态推荐，空时按偏好匹配分数实时计算
  return state.recommendations.length
    ? state.recommendations.map((item) => item.destination ? item : { destination: item, score: item.weight || 80 })
    : [...destinations]
        .map((destination) => ({ destination, score: destinationMatchScore(destination) }))
        .sort((a, b) => b.score - a.score);
}

function visibleRecommendations(limit = 6) {
  return recommendationSource().filter((item) => matchesRecommendFilters(item.destination)).slice(0, limit);
}

function matchesRecommendFilters(destination) {
  if (!state.recommendFilters.length) return !state.dismissed.includes(destination.id);
  const text = `${destination.name} ${destination.country} ${destination.region} ${destination.budget} ${(destination.tags || []).join(" ")}`;
  return !state.dismissed.includes(destination.id) && state.recommendFilters.some((filter) => text.includes(filter.replace("经济实惠", "省钱").replace("自然风景", "自然").replace("人文历史", "人文")));
}

function recommendCard(item) {
  const d = item.destination;
  return `<article class="card rec-card">
    ${destinationPhoto(d, "cardimg")}
    <div class="rec-body"><small>${esc(item.score)} 匹配 · ${esc(d.season)}</small><h3>${esc(d.name)}</h3><p>${esc(item.reason || d.summary)}</p><p class="muted">${esc(item.difference || "保留熟悉的松弛感，但主体体验不重复。")}</p><div class="actions">${button("想去", "wish", { cls: "primary", id: d.id })}${button("避开", "dismiss", { id: d.id })}${button("详情", "go", { route: `/destination/${d.id}` })}</div></div>
  </article>`;
}

function wishlist() {
  const items = state.wished.map((id) => destinations.find((d) => d.id === id)).filter(Boolean);
  return shell(header("愿望清单", "收藏目的地，也收藏出发窗口、预算判断和后续规划入口。") + `<div class="wishlist">${items.length ? items.map((d, index) => `<article class="panel row"><b>P${index + 1}</b>${destinationPhoto(d, "miniimg")}<div><h3>${esc(d.name)}</h3><p class="muted">${esc(d.intro)}</p></div><span class="muted">${esc(d.season)}<br>${esc(d.budget)}</span><div class="row-actions">${button("开始规划", "go", { cls: "primary", route: "/planner" })}${button("移除", "removeWish", { id: d.id, icon: "close" })}</div></article>`).join("") : emptyState("愿望清单还是空的", "在探索页或推荐页点击“想去”，这里会出现可规划目的地。")}</div>`);
}

function profile() {
  const pendingCount = state.preferences.filter((item) => (item.status || "pending") === "pending").length;
  const metrics = preferenceMetrics();
  const preferenceTypes = [["like", "喜欢"], ["avoid", "不喜欢/避开"], ["budget", "预算"], ["pace", "节奏"], ["food", "饮食"], ["lodging", "住宿"], ["transport", "交通"], ["general", "其他"]];
  const typePicker = `<div class="preference-picker">${preferenceTypes.map(([value, label]) => button(label, "setPreferenceType", { cls: `pref-type ${state.preferenceType === value ? "on" : ""}`, value })).join("")}</div><input id="preferenceType" type="hidden" value="${esc(state.preferenceType)}">`;
  return shell(header("个人画像", "AI 可以推断，但必须透明、可编辑、可删除。", button("刷新偏好", "loadPreferences", { disabled: state.loading.preferences })) + `<div class="grid2">
    <section class="panel">
      ${panelTitle("偏好雷达", "由已确认偏好汇总")}
      <div class="radar-grid">${metrics.map(([name, value]) => `<article class="metric"><b>${esc(name)}</b><strong>${esc(value)}</strong></article>`).join("")}</div>
      <div class="notice">确认偏好会提高推荐权重；忽略偏好仍保留记录，但不参与推荐加权。</div>
      ${preferenceMindMap(metrics)}
    </section>
    <section class="panel">
      ${panelTitle("动态偏好更新", `${pendingCount} 条待处理 / ${state.preferences.length} 条记忆`)}
      <div class="form"><label>偏好类型${typePicker}</label><label>新增偏好<textarea id="preferenceInput" rows="3" placeholder="例如：我喜欢海边慢游和本地小店，不想再去商业化古镇。"></textarea></label><div class="actions">${button("写入偏好库", "addPreference", { cls: "primary", disabled: state.loading.preferences })}${button("刷新", "loadPreferences")}</div></div>
      ${preferenceRows()}
    </section>
  </div>`);
}

function preferenceRows() {
  const displayPreferences = usefulPreferences();
  const pending = displayPreferences.filter((item) => (item.status || "pending") === "pending");
  if (!displayPreferences.length) return emptyState("还没有可用偏好记忆", "可以从 AI 聊天或手动输入开始。乱码和过短记录会被自动隐藏。");
  if (!pending.length) return emptyState("没有待处理偏好", "已确认或忽略的偏好会继续保存在数据库中，并参与后续画像或审计。");
  return pending.slice(0, 10).map((item) => `<article class="card memory-card">
    <div class="profile-row"><span><b>${esc(item.title)}</b><br><span class="muted">${esc(item.detail)}</span></span><small>${esc(item.type)} · ${esc(item.status)}</small></div>
    ${tagrow((item.tags || []).slice(0, 8))}
    <div class="actions">${button("确认", "setPreference", { id: item.id, value: "confirmed" })}${button("忽略", "setPreference", { id: item.id, value: "ignored" })}${button("删除", "deletePreference", { id: item.id, cls: "ghost danger" })}</div>
  </article>`).join("");
}

// ── 设置页卡片辅助函数 ──────────────────────────────────────
function settingCardHeader(icon, title, desc) {
  return `<div class="setting-card-header"><span class="setting-card-icon">${icon}</span><div><b>${esc(title)}</b><small>${esc(desc)}</small></div></div>`;
}

function settings() {
  const publicSettings = bootstrap.settingsPublic || {};
  const bootstrapSettings = bootstrap.settings || {};
  const settings = state.integrations || bootstrapSettings || {
    map: { provider: "高德地图", jsKey: publicSettings.map?.jsKey || "", securityJsCode: publicSettings.map?.securityJsCode || "", webServiceKey: "" },
    unsplash: { accessKey: publicSettings.unsplash?.accessKey || "", secretKey: "" },
    media: { pexelsApiKey: "", pixabayApiKey: "", apihzId: "", apihzKey: "" },
    dify: {
      enabled: publicSettings.dify?.enabled || false,
      baseUrl: publicSettings.dify?.baseUrl || "",
      chatflowApiKey: "",
      tripWorkflowApiKey: "",
      recommendWorkflowApiKey: "",
      preferenceWorkflowApiKey: "",
      detailWorkflowApiKey: "",
      timeout: 90,
    },
  };

  const makeInput = (id, value, placeholder = "", disabled = false) =>
    `<input id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${disabled ? "disabled" : ""}>`;

  const settingRow = ([name, value, action, route]) => `<article class="panel profile-row setting-row"><span><b>${esc(name)}</b><br><span class="muted">${esc(value)}</span></span>${action ? button(action === "toggleTheme" ? "切换" : "打开", action, { cls: "ghost", route }) : `<span class="state-pill">已说明</span>`}</article>`;

  const quickLinks = [
    ["个人画像与偏好", "查看偏好雷达、神经图和待确认偏好。", "go", "/profile"],
    ["旅行记忆与足迹", "管理历史旅行、AI 记忆影响。", "go", "/memories"],
    ["愿望清单", "查看想去、避开和已降低权重的地点。", "go", "/wishlist"],
    ["显示模式", state.theme === "light" ? "当前为日间模式" : "当前为夜间模式", "toggleTheme", ""],
  ];

  return shell(header("设置", "系统接入配置与应用偏好") + `
    <div class="settings-page">
      <div class="setting-card quick-card">
        ${settingCardHeader("⚡", "快捷入口", "常用页面直达")}
        <div class="setting-card-body">${quickLinks.map(settingRow).join("")}</div>
      </div>

      <div class="settings-notice">🔒 API 密钥由开发者在项目根目录的 <code>.env</code> 文件或服务器环境变量中配置，此处仅作展示。如需修改请编辑 <code>.env</code> 文件后重启服务。</div>

      <div class="setting-card">
        ${settingCardHeader("🔧", "Dify 工作流引擎", "所有 AI 功能通过 Dify 工作流驱动")}
        <div class="setting-card-body">
          <label><span>启用 Dify</span><select id="difyEnabled"><option value="1" ${settings.dify?.enabled ? "selected" : ""}>是</option><option value="0" ${!settings.dify?.enabled ? "selected" : ""}>否</option></select></label>
          <label><span>Dify Base URL</span>${makeInput("difyBaseUrl", settings.dify?.baseUrl || "http://220.160.32.216:8088", "http://220.160.32.216:8088/v1", true)}</label>
          <label><span>AI 顾问 Chatflow Key</span>${makeInput("difyChatflowApiKey", settings.dify?.chatflowApiKey || "", "app-...", true)}</label>
          <label><span>行程生成 Workflow Key</span>${makeInput("difyTripWorkflowApiKey", settings.dify?.tripWorkflowApiKey || "", "app-...", true)}</label>
          <label><span>推荐刷新 Workflow Key</span>${makeInput("difyRecommendWorkflowApiKey", settings.dify?.recommendWorkflowApiKey || "", "app-...", true)}</label>
          <label><span>偏好画像 Workflow Key</span>${makeInput("difyPreferenceWorkflowApiKey", settings.dify?.preferenceWorkflowApiKey || "", "app-...", true)}</label>
          <label><span>目的地详情 Workflow Key</span>${makeInput("difyDetailWorkflowApiKey", settings.dify?.detailWorkflowApiKey || "", "app-...", true)}</label>
          <label><span>超时(秒)</span><input id="difyTimeout" type="number" value="${esc(settings.dify?.timeout || 90)}" min="5" max="180"></label>
        </div>
      </div>

      <div class="setting-card">
        ${settingCardHeader("🗺️", "高德地图", "地图展示与地理编码服务")}
        <div class="setting-card-body">
          <label><span>JS Key</span>${makeInput("mapJsKey", settings.map?.jsKey || "", "", true)}</label>
          <label><span>安全密钥 securityJsCode</span>${makeInput("mapSecurityJsCode", settings.map?.securityJsCode || "", "", true)}</label>
          <label><span>Web 服务 Key</span>${makeInput("mapWebServiceKey", settings.map?.webServiceKey || "", "", true)}</label>
        </div>
      </div>

      <div class="setting-card">
        ${settingCardHeader("🖼️", "Unsplash 图库", "高质量图片素材源")}
        <div class="setting-card-body">
          <label><span>Access Key</span>${makeInput("unsplashAccessKey", settings.unsplash?.accessKey || "", "", true)}</label>
          <label><span>Secret Key</span>${makeInput("unsplashSecretKey", settings.unsplash?.secretKey || "", "", true)}</label>
        </div>
      </div>

      <div class="setting-card">
        ${settingCardHeader("📷", "图片聚合搜索", "多源图片聚合，打乱后展示；未配置时保留渐变兜底")}
        <div class="setting-card-body">
          <label><span>Pexels API Key</span>${makeInput("pexelsApiKey", settings.media?.pexelsApiKey || "", "", true)}</label>
          <label><span>Pixabay API Key</span>${makeInput("pixabayApiKey", settings.media?.pixabayApiKey || "", "", true)}</label>
          <label><span>接口盒子 开发者 ID</span>${makeInput("apihzId", settings.media?.apihzId || "", "", true)}</label>
          <label><span>接口盒子 开发者 KEY</span>${makeInput("apihzKey", settings.media?.apihzKey || "", "", true)}</label>
        </div>
      </div>

      <div class="settings-actions">
        ${button("保存所有配置", "saveSettings", { cls: "primary", disabled: state.loading.integrations })}
        ${button("重新读取", "loadSettings")}
        ${button("运行 API 诊断", "runApiCheck", { cls: "ghost" })}
      </div>
      <div id="apiCheckResult"></div>
    </div>`);
}

function destinationPage(id) {
  const d = routeDestination(`/destination/${id}`);
  if (id === "map-picked" && !state.pendingDetailPlace) {
    toast("请先在地图上点击一个位置，再查看详情。", "warn");
    state.route = "/";
    location.hash = "/";
    return render();
  }
  const tabs = ["总览", "地理分析", "图片", "评论", "路线", "预算", "避坑", "相似但不重复"];
  const detail = state.destinationDetails[d.id]?.detail;
  const loading = state.loading[`detail-${d.id}`] && !detail;
  const displayName = detail?.name || d.name;
  const isPicked = id === "map-picked";
  const backRoute = isPicked ? "/" : "/recommend";
  const backLabel = isPicked ? "返回地图" : "返回推荐";
  const actions = `${button(backLabel, "go", { cls: "ghost", route: backRoute, icon: "close" })}${button("规划这里", "planDestination", { cls: "primary", id: d.id, icon: "route" })}`;
  // Allow the "图片" tab to show gallery content even while the AI detail is
  // still loading, so image placeholders appear instead of generic skeleton cards.
  const tabBody = loading && state.activeDestinationTab !== "图片"
    ? detailPanelSkeleton()
    : destinationTabBody(d);
  return shell(header(displayName, `${d.country} · ${d.region} · ${d.season}`, actions) + `<section class="panel detail-hero">${destinationPhoto(d, "cover")}<div><h1>${esc(displayName)}</h1>${loading ? detailHeroSkeleton() : `<p class="muted">${esc(detail?.summary || d.summary)}</p>${tagrow(d.tags)}`}<div class="actions">${button("想去", "wish", { cls: "primary", id: d.id })}${button("避开", "dismiss", { id: d.id })}</div></div></section>${loading && state.activeDestinationTab !== "图片" ? destinationDetailLoading() : ""}<div class="tabbar">${tabs.map((tab) => chip(tab, "setDestinationTab", state.activeDestinationTab === tab)).join("")}</div><section class="panel">${tabBody}</section>`);
}

function destinationDetail(d) {
  return state.destinationDetails[d.id]?.detail || null;
}

function detailHeroSkeleton() {
  return `<div class="skeleton-stack"><span class="skeleton-line wide"></span><span class="skeleton-line"></span><span class="skeleton-line short"></span></div>`;
}

function detailPanelSkeleton() {
  return `<div class="grid3">${Array.from({ length: 6 }, () => `<article class="card skeleton-card"><span class="skeleton-line short"></span><span class="skeleton-line wide"></span><span class="skeleton-line"></span></article>`).join("")}</div>`;
}

function destinationDetailLoading() {
  return `<div class="detail-loading"><div><b>AI 正在生成目的地详情</b><span>首次请求会写入本地数据库，之后相同目的地直接复用缓存。</span></div><i></i></div>`;
}

function infoCard(title, body) {
  return `<article class="card"><small>${esc(title)}</small><p>${esc(body)}</p></article>`;
}

function destinationTabBody(d) {
  const detail = destinationDetail(d);
  if (state.activeDestinationTab === "图片") {
    if (state.loading.gallery && !state.galleryImages.length) return `<div class="gallery">${Array.from({ length: 6 }, () => `<div class="gallery-photo media-skeleton"></div>`).join("")}</div>`;
    const gallery = state.galleryImages.length ? state.galleryImages : ["自然风光", "城市街景", "人文建筑", "美食", "夜景", "小众地点"].map((category) => ({ category, caption: `${d.name} · ${category}`, color: d.img }));
    return `<div class="gallery">${gallery.map((item) => item.url ? `<a class="gallery-photo" href="${esc(item.link)}" target="_blank" rel="noreferrer"><img src="${esc(item.url)}" alt="${esc(item.caption)}"><b>${esc(item.author || item.category)}</b></a>` : `<div class="gallery-tile ${esc(item.color || d.img)}\"><b>${esc(item.category)}</b><span>${esc(item.caption)}</span></div>`).join("")}</div>`;
  }
  if (state.activeDestinationTab === "预算") {
    const rows = detail?.budget || ["交通", "住宿", "餐饮", "门票", "购物", "备用金"].map((title, i) => ({ title, amount: [900, 1600, 780, 420, 500, 600][i], note: "默认档位：均衡舒适，可在行程页调整。" }));
    return `<div class="grid3">${rows.map((item) => `<article class="card"><small>${esc(item.title)}</small><h2>¥${esc(item.amount || 0)}</h2><p>${esc(item.note || "按实际出行季节微调。")}</p></article>`).join("")}</div>`;
  }
  if (state.activeDestinationTab === "避坑") {
    const rows = detail?.pitfalls || ["天气风险", "交通风险", "安全提醒", "消费陷阱", "文化礼仪", "不推荐时间"].map((title) => ({ title, body: "提供备选路线和避峰建议，避免把旅行塞成任务表。" }));
    return `<div class="stack">${rows.map((item) => `<article class="card risk"><b>${esc(item.title)}</b><span class="muted">${esc(item.body)}</span></article>`).join("")}</div>`;
  }
  if (state.activeDestinationTab === "路线") {
    const rows = detail?.route || ["抵达交通与住处", "核心区域慢行", "备选低峰路线"];
    return `<div class="timeline">${rows.map((item, i) => planDay(item, i)).join("")}</div>`;
  }
  if (state.activeDestinationTab === "地理分析") {
    const rows = detail?.geography || ["自然地理", "人文地理", "社会经济条件", "人地关系"].map((title) => ({ title, body: `${d.name} 适合结合交通节点规划，不建议一次性塞满多个远距离点位。` }));
    return `<div class="geo">${rows.map((item) => `<article class="card"><h3>${esc(item.title)}</h3><p><b>位置判断</b><br><span class="muted">${esc(item.body)}</span></p></article>`).join("")}</div>`;
  }
  if (state.activeDestinationTab === "相似但不重复") {
    const rows = detail?.similarButDifferent || [{ title: "相似点", body: "保留熟悉的生活感和慢游节奏。" }, { title: "不同点", body: "减少重复古镇和过度商业化体验。" }];
    return `<div class="grid3">${rows.map((item) => infoCard(item.title, item.body)).join("")}</div>`;
  }
  const rows = [
    ["AI 目的地总结", detail?.summary || d.summary],
    ["为什么适合你", detail?.suitableFor || "兼顾慢游、人文、摄影和预算控制。"],
    ["和去过的地方有什么不同", detail?.difference || "保留熟悉的生活感，但减少重复古镇和过度商业化体验。"],
    ["一句话亮点", detail?.highlight || "把一天留给一个区域，旅行会变得很从容。"],
    ["一句话劝退", detail?.warning || "如果只能节假日冲热门点，这里会显得拥挤且昂贵。"],
    ["推荐玩法", detail?.play || "清晨主线 + 下午留白 + 晚间散步。"],
  ];
  return `<div class="grid3">${rows.map(([title, body]) => infoCard(title, body)).join("")}</div>`;
}

function admin() {
  if (!isAdmin()) {
    return `<div class="${state.theme === "light" ? "light " : ""}login admin-lock">
      <section class="auth">${themeSwitch()}<h2>后台需要管理员权限</h2><p class="muted">普通用户不能进入后台。请使用管理员账号登录。</p><label>邮箱<input id="email" value="admin@shiguang.travel"></label><label>密码<input id="password" type="password" value="shiguang-admin"></label>${button("管理员登录", "loginAdmin", { cls: "primary full", icon: "lock" })}${button("回到前台", "go", { cls: "ghost full", route: "/" })}</section>
      ${toastStack()}
    </div>`;
  }
  const sections = [
    ["dashboard", "仪表盘"], ["users", "用户管理"], ["preferences", "偏好审核"], ["media", "图片素材"], ["audit", "系统审计"], ["destinations", "目的地管理"], ["trips", "行程管理"], ["content", "内容源"], ["prompts", "AI 提示词"], ["settings", "系统设置"],
  ];
  return `<div class="${state.theme === "light" ? "light " : ""}admin">
    <aside class="admin-side">
      ${button("<b>运营中枢</b><small>ADMIN CONSOLE</small>", "go", { cls: "brand", route: "/" })}
      ${sections.map(([id, label]) => button(label, "adminTab", { cls: `ghost ${state.activeAdmin === id ? "on" : ""}`, value: id })).join("")}
    </aside>
    <main class="workspace">${header("运营中枢", "目的地、用户、AI 提示词和系统状态集中管理。", button("刷新后台", "loadAdminStats"))}${adminBody()}</main>
    ${toastStack()}
  </div>`;
}

function adminBody() {
  if (state.activeAdmin === "settings") return `<section class="panel">${integrationSettingsForm()}</section>`;
  if (state.activeAdmin === "users") return adminUsers();
  if (state.activeAdmin === "preferences") return adminPreferences();
  if (state.activeAdmin === "media") return adminMedia();
  if (state.activeAdmin === "audit") return adminAudit();
  if (state.activeAdmin === "destinations") return adminTable("目的地管理", ["名称", "国家", "标签", "权重"], destinations.map((d) => [d.name, d.country, d.tags.slice(0, 3).join(" / "), d.weight]));
  if (state.activeAdmin === "trips") return adminTable("行程管理", ["标题", "目的地", "预算", "状态"], (state.plans.length ? state.plans : [defaultPlan()]).map((p) => [p.title, p.destination || "冰岛", `¥${p.estimate}`, "可导出"]));
  if (state.activeAdmin === "content") return adminTable("内容源", ["来源", "配置", "模式", "状态"], [["接口盒子·百度", bootstrap.settingsPublic?.media?.apihzBaiduConfigured ? "已配置" : "未配置", "live", "可用"], ["接口盒子·搜狗", bootstrap.settingsPublic?.media?.apihzBaiduConfigured ? "已配置" : "未配置", "live", "可用"], ["Unsplash", bootstrap.settingsPublic?.unsplash?.configured ? "已配置" : "未配置", "live/fallback", "可用"], ["Pexels", bootstrap.settingsPublic?.media?.pexelsConfigured ? "已配置" : "未配置", "live", "可用"], ["Pixabay", bootstrap.settingsPublic?.media?.pixabayConfigured ? "已配置" : "未配置", "live", "可用"], ["高德地图", bootstrap.settingsPublic?.map?.configured ? "已配置" : "未配置", "JS API + Web 服务", "可用"]]);
  if (state.activeAdmin === "prompts") return adminTable("AI 提示词", ["场景", "版本", "状态", "输出"], [["目的地总结", "v1", "开启", "结构化"], ["行程规划", "v1", "开启", "结构化"], ["画像推断", "v1", "开启", "偏好向量"]]);
  const stats = state.adminStats || bootstrap.adminStats || {};
  const hotDestinations = [...destinations].sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0)).slice(0, 4);
  return `<div class="grid4">${[["用户数", stats.users ?? state.users.length], ["目的地", stats.destinations ?? destinations.length], ["行程数", stats.plans ?? state.tripRecords.length], ["AI 请求", stats.aiRequests ?? state.preferences.filter((item) => item.source === "chat").length], ["收藏数", stats.wishlist ?? state.wished.length], ["数据库", bootstrap.database?.driver?.toUpperCase() || "JSON"]].map(([k, v]) => `<article class="panel stat"><span class="muted">${esc(k)}</span><strong>${esc(v)}</strong></article>`).join("")}</div><div class="grid2 spaced"><section class="panel">${panelTitle("热门目的地", "按目的地权重")}${hotDestinations.map((d) => `<div class="table-row"><span>${esc(d.name)}</span><div class="heat"><i style="width:${Math.max(8, Math.min(100, Number(d.weight || 0)))}%"></i></div><b>${esc(d.weight || 0)}</b></div>`).join("")}</section><section class="panel">${panelTitle("系统状态", "来自当前前端状态")}${endpointStatusRows().map(([name, status]) => `<div class="profile-row"><span>${esc(name)}</span><small>${esc(status)}</small></div>`).join("")}</section></div>`;
}

function adminTable(title, headings, rows) {
  return `<section class="panel">${panelTitle(title, `${rows.length} 项`)}<table class="admin-table"><thead><tr>${headings.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`;
}

function adminUsers() {
  const editing = state.users.find((user) => user.id === state.editingUserId) || {};
  const rows = state.users.map((user) => `<tr>
    <td><b>${esc(user.name)}</b><br><span class="muted">${esc(user.id)}</span></td>
    <td>${esc(user.email)}</td>
    <td>${esc(user.role)}</td>
    <td>${esc(user.status || "active")}</td>
    <td>${esc(user.profile?.persona || "")}<br><span class="muted">${esc(user.updatedAt ? formatChatTime(user.updatedAt) : "未记录")}</span></td>
    <td class="row-actions">${button("编辑", "editUser", { id: user.id, icon: "edit" })}${button("删除", "deleteUser", { id: user.id, cls: "ghost danger", icon: "trash", disabled: user.id === "admin" })}</td>
  </tr>`).join("");
  return `<div class="grid2 admin-users">
    <section class="panel">${panelTitle("用户管理", `${state.users.length} 位用户`)}
      <table class="admin-table"><thead><tr><th>用户</th><th>邮箱</th><th>角色</th><th>状态</th><th>画像</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>
    </section>
    <section class="panel form">
      ${panelTitle(editing.id ? "修改用户详细信息" : "新增用户", "最大化利用 MySQL users 表")}
      <input id="userId" type="hidden" value="${esc(editing.id || "")}">
      <label>姓名<input id="userName" value="${esc(editing.name || "")}"></label>
      <label>邮箱<input id="userEmail" value="${esc(editing.email || "")}"></label>
      <label>角色<select id="userRole"><option value="user" ${editing.role !== "admin" ? "selected" : ""}>普通用户</option><option value="admin" ${editing.role === "admin" ? "selected" : ""}>管理员</option></select></label>
      <label>状态<select id="userStatus"><option value="active" ${editing.status !== "disabled" ? "selected" : ""}>启用</option><option value="disabled" ${editing.status === "disabled" ? "selected" : ""}>停用</option></select></label>
      <label>重置密码<input id="userPassword" type="password" placeholder="${editing.id ? "留空则不修改；填写后由管理员重置" : "默认 shiguang123"}"></label>
      <label>画像<input id="userPersona" value="${esc(editing.profile?.persona || "")}"></label>
      <label>预算层级<input id="userBudget" value="${esc(editing.profile?.budgetLevel || "")}"></label>
      <label>旅行节奏<input id="userPace" value="${esc(editing.profile?.travelPace || "")}"></label>
      <label>避雷点<textarea id="userAvoidances" rows="3">${esc(editing.profile?.avoidances || "")}</textarea></label>
      <div class="notice">后台修改会同步到用户登录资料；填写重置密码时无需用户当前密码，但会覆盖该用户登录密码。</div>
      <div class="actions">${button("保存用户", "saveUser", { cls: "primary", icon: "download", disabled: state.loading.users })}${button("新建空表单", "newUser", { icon: "plus" })}</div>
    </section>
  </div>`;
}

function adminPreferences() {
  const rows = (state.adminPreferences.length ? state.adminPreferences : state.preferences).slice(0, 18);
  const pending = rows.filter((item) => (item.status || "pending") === "pending").length;
  return `<section class="panel">${panelTitle("偏好审核", `${pending} 条待处理 / ${rows.length} 条载入`)}
    <div class="stack">${rows.length ? rows.map((item) => `<article class="card admin-review">
      <div class="profile-row"><span><b>${esc(item.title)}</b><br><span class="muted">${esc(item.detail)}</span></span><small>${esc(item.userId || "demo")} · ${esc(item.type)} · ${esc(item.status)}</small></div>
      ${tagrow((item.tags || []).slice(0, 8))}
      <div class="actions">${button("确认", "adminSetPreference", { id: item.id, value: "confirmed" })}${button("忽略", "adminSetPreference", { id: item.id, value: "ignored" })}${button("删除", "adminDeletePreference", { id: item.id, cls: "ghost danger", icon: "trash" })}</div>
    </article>`).join("") : emptyState("暂无偏好记录", "用户聊天或手动写入偏好后，会进入这里审核。")}</div>
  </section>`;
}

function adminMedia() {
  const configured = bootstrap.settingsPublic?.unsplash?.configured || bootstrap.settingsPublic?.media?.pexelsConfigured || bootstrap.settingsPublic?.media?.pixabayConfigured || bootstrap.settingsPublic?.media?.tencentWimgsConfigured || bootstrap.settingsPublic?.media?.apihzBaiduConfigured;
  return `<section class="panel">${panelTitle("图片素材覆盖", configured ? "聚合图源可用" : "缺少可用图源")}
    <div class="grid3">${destinations.map((destination) => {
      const media = state.destinationMedia[destination.id] || [];
      const providers = [...new Set(media.map((item) => item.provider).filter(Boolean))].join(" / ") || "未加载";
      return `<article class="card media-admin-card">
        ${destinationPhoto(destination, "cardimg")}
        <h3>${esc(destination.name)}</h3>
        <p class="muted">${esc(providers)} · ${media.length} 张</p>
        <div class="actions">${button(state.loading[`media-${destination.id}`] ? loadingDots("加载图片") : "拉取图片", "adminLoadMedia", { id: destination.id, icon: "download", disabled: state.loading[`media-${destination.id}`] })}${button("清除缓存", "adminClearMedia", { id: destination.id, cls: "ghost danger", icon: "trash", disabled: !media.length })}</div>
      </article>`;
    }).join("")}</div>
  </section>`;
}

function adminAuditItems() {
  const publicSettings = bootstrap.settingsPublic || {};
  const items = [];
  if (!publicSettings.ai?.deepseekConfigured && !publicSettings.ai?.doubaoConfigured && !publicSettings.ai?.openaiCompatibleConfigured) items.push(["AI 对话未配置", "用户会看到本地兜底回复。", "settings"]);
  if (!publicSettings.unsplash?.configured && !publicSettings.media?.pexelsConfigured && !publicSettings.media?.pixabayConfigured && !publicSettings.media?.tencentWimgsConfigured && !publicSettings.media?.apihzBaiduConfigured) items.push(["图片源未配置", "目的地实景图会回退到渐变底。", "settings"]);
  if (!publicSettings.map?.configured) items.push(["地图 JS Key 未配置", "首页地图会显示模拟背景。", "settings"]);
  const pending = (state.adminPreferences.length ? state.adminPreferences : state.preferences).filter((item) => (item.status || "pending") === "pending").length;
  if (pending) items.push(["存在待审核偏好", `${pending} 条偏好会作为弱信号影响 AI。`, "preferences"]);
  const missingMedia = destinations.filter((destination) => !(state.destinationMedia[destination.id] || []).length).length;
  if (missingMedia) items.push(["目的地图片覆盖不足", `${missingMedia} 个目的地尚无真实图片缓存。`, "media"]);
  if (!state.users.length) items.push(["用户列表未读取", "后台用户管理需要刷新数据。", "users"]);
  return items;
}

function adminAudit() {
  const items = adminAuditItems();
  return `<section class="panel">${panelTitle("系统审计", items.length ? `${items.length} 个待处理项` : "未发现高优先级问题")}
    <div class="stack">${items.length ? items.map(([title, detail, tab]) => `<article class="card profile-row"><span><b>${esc(title)}</b><br><span class="muted">${esc(detail)}</span></span>${button("处理", "adminTab", { value: tab, icon: "edit" })}</article>`).join("") : emptyState("系统状态良好", "核心接口、素材覆盖和审核队列暂未发现高优先级问题。")}</div>
  </section>`;
}

function integrationSettingsForm() {
  const settings = state.integrations || {
    map: { provider: "高德地图", jsKey: bootstrap.settingsPublic?.map?.jsKey || "", securityJsCode: bootstrap.settingsPublic?.map?.securityJsCode || "", webServiceKey: "" },
    unsplash: { applicationId: bootstrap.settingsPublic?.unsplash?.applicationId || "", accessKey: bootstrap.settingsPublic?.unsplash?.accessKey || "", secretKey: "" },
    media: { pexelsApiKey: "", pixabayApiKey: "", tencentSecretId: "", tencentSecretKey: "", apihzId: "", apihzKey: "" },
    ai: {
      defaultProvider: bootstrap.settingsPublic?.ai?.defaultProvider || "deepseek",
      deepseek: { apiKey: "", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash" },
      doubao: { apiKey: "", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-1-6-250615" },
      openaiCompatible: { apiKey: "", baseUrl: "", model: "" },
    },
    dify: {
      enabled: bootstrap.settingsPublic?.dify?.enabled || false,
      baseUrl: bootstrap.settingsPublic?.dify?.baseUrl || "",
      taskWorkflowApiKey: "",
      chatflowApiKey: "",
      timeout: 90,
    },
  };

  const inp = (id, value, placeholder = "", disabled = false) =>
    `<input id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${disabled ? "disabled" : ""}>`;

  const card = (icon, title, desc, body) =>
    `<div class="setting-card">${settingCardHeader(icon, title, desc)}<div class="setting-card-body">${body}</div></div>`;

  // Use global settingCardHeader
  return `<div class="settings-form">
    ${panelTitle("系统接入配置", state.loading.integrations ? "保存中" : "真实接口优先")}
    <div class="settings-page">
      ${card("🗺️", "高德地图", "地图展示与地理编码服务",
        `<label><span>地图供应商</span>${inp("mapProvider", "高德地图", "", true)}</label>
         <label><span>JS Key</span>${inp("mapJsKey", settings.map?.jsKey, "", true)}</label>
         <label><span>安全密钥 securityJsCode</span>${inp("mapSecurityJsCode", settings.map?.securityJsCode, "", true)}</label>
         <label><span>Web 服务 Key</span>${inp("mapWebServiceKey", settings.map?.webServiceKey, "", true)}</label>`)}
      ${card("🖼️", "Unsplash 图库", "高质量图片素材源",
        `<label><span>Application ID</span>${inp("unsplashApplicationId", settings.unsplash?.applicationId, "", true)}</label>
         <label><span>Access Key</span>${inp("unsplashAccessKey", settings.unsplash?.accessKey, "", true)}</label>
         <label><span>Secret Key</span>${inp("unsplashSecretKey", settings.unsplash?.secretKey, "", true)}</label>`)}
      ${card("📷", "图片聚合", "多源聚合，未配置时保留渐变兜底",
        `<label><span>Pexels API Key</span>${inp("pexelsApiKey", settings.media?.pexelsApiKey, "", true)}</label>
         <label><span>Pixabay API Key</span>${inp("pixabayApiKey", settings.media?.pixabayApiKey, "", true)}</label>
         <label><span>腾讯云 SecretId</span>${inp("tencentSecretId", settings.media?.tencentSecretId, "", true)}</label>
         <label><span>腾讯云 SecretKey</span>${inp("tencentSecretKey", settings.media?.tencentSecretKey, "", true)}</label>
         <label><span>接口盒子 开发者 ID</span>${inp("apihzId", settings.media?.apihzId, "", true)}</label>
         <label><span>接口盒子 开发者 KEY</span>${inp("apihzKey", settings.media?.apihzKey, "", true)}</label>`)}
      ${card("🤖", "DeepSeek", "AI 对话引擎",
        `<label><span>API Key</span>${inp("deepseekApiKey", settings.ai?.deepseek?.apiKey, "", true)}</label>
         <label><span>Base URL</span>${inp("deepseekBaseUrl", settings.ai?.deepseek?.baseUrl || "https://api.deepseek.com", "", true)}</label>
         <label><span>模型</span>${inp("deepseekModel", settings.ai?.deepseek?.model || "deepseek-v4-flash", "", true)}</label>`)}
      ${card("🧠", "豆包 / 火山方舟", "AI 对话引擎",
        `<label><span>API Key</span>${inp("doubaoApiKey", settings.ai?.doubao?.apiKey, "", true)}</label>
         <label><span>Base URL</span>${inp("doubaoBaseUrl", settings.ai?.doubao?.baseUrl || "https://ark.cn-beijing.volces.com/api/v3", "", true)}</label>
         <label><span>模型 / Endpoint ID</span>${inp("doubaoModel", settings.ai?.doubao?.model || "doubao-seed-1-6-250615", "", true)}</label>`)}
      ${card("🔗", "OpenAI 兼容接口", "AI 对话引擎",
        `<label><span>API Key</span>${inp("openaiCompatibleApiKey", settings.ai?.openaiCompatible?.apiKey, "", true)}</label>
         <label><span>Base URL</span>${inp("openaiCompatibleBaseUrl", settings.ai?.openaiCompatible?.baseUrl, "", true)}</label>
         <label><span>模型</span>${inp("openaiCompatibleModel", settings.ai?.openaiCompatible?.model, "", true)}</label>`)}
      ${card("⚙️", "默认 AI", "AI 对话优先调用的供应商",
        `<label><span>默认供应商</span><select id="aiDefaultProvider"><option value="deepseek" ${settings.ai?.defaultProvider === "deepseek" ? "selected" : ""}>DeepSeek</option><option value="doubao" ${settings.ai?.defaultProvider === "doubao" ? "selected" : ""}>豆包</option><option value="openaiCompatible" ${settings.ai?.defaultProvider === "openaiCompatible" ? "selected" : ""}>OpenAI 兼容接口</option></select></label>`)}
      ${card("🔧", "Dify 工作流引擎", "配置后行程生成和 AI 对话将优先使用 Dify 工作流，失败时自动回退本地",
        `<label><span>启用</span><select id="difyEnabled"><option value="1" ${settings.dify?.enabled ? "selected" : ""}>是</option><option value="0" ${!settings.dify?.enabled ? "selected" : ""}>否</option></select></label>
         <label><span>Dify Base URL</span>${inp("difyBaseUrl", settings.dify?.baseUrl || "", "https://dify.example.com", true)}</label>
         <label><span>任务工作流 API Key</span>${inp("difyTaskWorkflowApiKey", settings.dify?.taskWorkflowApiKey || "", "app-...", true)}</label>
         <label><span>对话流 API Key</span>${inp("difyChatflowApiKey", settings.dify?.chatflowApiKey || "", "app-...", true)}</label>
         <label><span>超时(秒)</span><input id="difyTimeout" type="number" value="${esc(settings.dify?.timeout || 90)}" min="5" max="180"></label>`)}
      <div class="settings-actions">
        ${button("保存配置", "saveIntegrationSettings", { cls: "primary", disabled: state.loading.integrations })}
        ${button("重新读取", "loadIntegrationSettings")}
        ${button("运行 API 诊断", "runApiCheck", { cls: "ghost" })}
      </div>
      <div id="apiCheckResult"></div>
    </div>
  </div>`;
}

// 单用户模式 - 移除登录，直接进入
function emptyState(title, text) {
  return `<div class="empty"><b>${esc(title)}</b><p>${esc(text)}</p></div>`;
}

function go(path) {
  state.route = path;
  location.hash = path;
  if (path === "/") state.aiExpanded = false;
  render();
}

async function sendAi(text) {
  const input = document.getElementById(state.route === "/" ? "mapAiInput" : "aiInput");
  const message = (text || input?.value || "").trim();
  if (!message) {
    toast("先说点你的旅行偏好。", "warn");
    return;
  }
  if (state.route === "/") {
    state.advisorDraft = message;
    writeJson("shiguang-advisor-draft", message);
    go("/advisor");
    return;
  }
  state.advisorDraft = "";
  writeJson("shiguang-advisor-draft", "");
  // 优先流式
  const conversationId = state.messages.length > 0
    ? (state.messages[state.messages.length - 1]?.conversationId || "")
    : "";
  if (typeof ReadableStream !== "undefined" && window.fetch) {
    return sendAiStream(message, conversationId);
  }

  // 阻塞式兜底
  state.aiExpanded = true;
  state.aiStickToBottom = true;
  state.messages.push({ role: "user", text: message });
  persistChat();
  setLoading("ai", true);
  try {
    const result = await apiJson("ai/chat", { message, conversation_id: conversationId, current_route: "advisor" });
    state.messages.push({ role: "assistant", text: result.message?.content || "我已经记住这条偏好，会在推荐里动态调整。", conversationId: result.message?.conversationId || conversationId });
    persistChat();
    if (result.memory) state.preferences = [result.memory, ...state.preferences.filter((item) => item.id !== result.memory.id)];
    toast(result.message?.fallback ? result.message?.content || "AI 远程接口失败，已使用本地兜底。" : "AI 已回复并写入画像。", result.message?.fallback ? "warn" : "success");
  } catch (error) {
    state.messages.push({ role: "assistant", text: `接口暂时不可用，我先按本地画像给你建议。${error.message || ""}` });
    persistChat();
    toast("AI 接口失败，已使用本地兜底。", "warn");
  } finally {
    setLoading("ai", false);
  }
}

function advisorPlan(id) {
  const destination = destinations.find((item) => item.id === id) || advisorActionDestination();
  state.selectedId = destination.id || state.selectedId;
  state.pendingPlanDestination = destination.name || "";
  state.plannerTags = [...new Set([...state.plannerTags, ...(destination.tags || []).slice(0, 3)])];
  toast("已把顾问建议带入行程规划。", "success");
  go("/planner");
}

function advisorMemory(id) {
  const destination = destinations.find((item) => item.id === id) || advisorActionDestination();
  const assistant = latestAssistantMessage();
  const record = {
    id: `advisor_memory_${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    destination: destination.name || "AI 顾问建议",
    mood: "AI 建议",
    cost: destination.estimate || destination.weight || 0,
    summary: assistant?.text ? assistant.text.slice(0, 86) : destination.summary || "从 AI 顾问对话沉淀的旅行灵感。",
  };
  state.tripRecords = [record, ...state.tripRecords];
  writeJson("shiguang-trip-records", state.tripRecords);
  toast("已加入旅行记忆。", "success");
  if (state.route === "/memories") render();
}

// ── 工作流进度 Stepper ──────────────────────────────────────────────────────────
// 每类工作流定义其全部步骤，与 Dify 工作流节点一一对应，让 Stepper 实时显示每步进度。

const WORKFLOW_STEPS = {
  // 行程生成 — 24 节点
  trip: [
    { key: "submit",           label: "接收行程参数",       detail: "提交目的地、天数和预算" },
    { key: "validate_params",  label: "参数基础校验",       detail: "校验参数合法性和范围" },
    { key: "route_check",      label: "参数完整性路由",     detail: "检查通过继续流程" },
    { key: "error_end",        label: "参数错误结束",       detail: "参数不合法时终止" },
    { key: "extract_prefs",    label: "偏好信号提取",       detail: "从偏好中提取 likes/avoids" },
    { key: "stats_prefs",      label: "偏好分类统计",       detail: "统计 confirmed/pending 分布" },
    { key: "kb_lookup",        label: "目的地知识检索",     detail: "查询知识库获取目的地信息" },
    { key: "weather",          label: "获取气候数据",       detail: "查询目的地天气气候" },
    { key: "holidays",         label: "节假日查询",         detail: "查询旅行期间的公共假日" },
    { key: "season_analysis",  label: "日期与季节分析",     detail: "计算旅行月份、季节和淡旺季" },
    { key: "budget_analysis",  label: "预算等级分析",       detail: "预算文本转等级和花费提示" },
    { key: "pace_assess",      label: "旅行节奏与主题评估", detail: "确定每日主题和整体节奏" },
    { key: "highlights_pre",   label: "目的地亮点预分析",   detail: "识别目的地最值得体验的亮点" },
    { key: "skeleton",         label: "行程骨架生成",       detail: "创建天数骨架和主题分配" },
    { key: "compose",          label: "生成每日行程内容",   detail: "生成每日上午下午晚间活动" },
    { key: "verify_days",      label: "行程天数校验",       detail: "校验天数匹配和时段完整" },
    { key: "polish",           label: "行程深度润色",       detail: "语言优化和内容润色" },
    { key: "extract_highlights",label: "行程亮点提炼",      detail: "提炼 3-5 个核心亮点" },
    { key: "overview",         label: "行程概述生成",       detail: "生成一句话行程概述" },
    { key: "estimate",         label: "预算花费估算",       detail: "根据等级和天数估算花费" },
    { key: "tips",             label: "出行贴士生成",       detail: "生成打包建议和出行提醒" },
    { key: "verify_all",       label: "完整结果校验",       detail: "最终完整性检查" },
    { key: "format",           label: "JSON 格式化输出",    detail: "包装 result_json 和版本号" },
    { key: "output",           label: "行程输出",           detail: "返回结构化行程 JSON" },
  ],
  // 推荐刷新 — 21 节点
  recommend: [
    { key: "submit",           label: "接收推荐参数",       detail: "接收偏好和候选目的地" },
    { key: "validate",         label: "输入数据校验",       detail: "校验 JSON 数组合法性" },
    { key: "route_check",      label: "校验结果路由",       detail: "合法继续，不合法返回错误" },
    { key: "error_end",        label: "参数错误结束",       detail: "返回错误信息" },
    { key: "classify_prefs",   label: "偏好信号分类",       detail: "按 type/status 四象限分类" },
    { key: "weight_calc",      label: "偏好强度计算",       detail: "为每类偏好计算权重分值" },
    { key: "dest_check",       label: "候选目的地检查",     detail: "空候选则输出空报告" },
    { key: "empty_end",        label: "无候选结果输出",     detail: "返回空推荐报告" },
    { key: "kb_lookup",        label: "目的地信息补全",     detail: "知识库检索候选地信息" },
    { key: "season",           label: "季节匹配分析",       detail: "获取当前季节气候参考" },
    { key: "budget_match",     label: "预算匹配分析",       detail: "分析目的地预算匹配度" },
    { key: "pace_match",       label: "节奏与特征匹配",     detail: "提取标签/区域/季节特征" },
    { key: "build_context",    label: "整合评分上下文",     detail: "合并所有数据供 LLM 评分" },
    { key: "evaluate",         label: "候选目的地批量评估", detail: "LLM 批量打分和生成理由" },
    { key: "verify_scores",    label: "评分结果校验",       detail: "校验 LLM 输出 JSON 结构" },
    { key: "sort",             label: "归一化与排序",       detail: "降序排列评分结果" },
    { key: "filter",           label: "阈值过滤与冲突标注", detail: "过滤低分并标注冲突" },
    { key: "report",           label: "推荐报告生成",       detail: "生成标题/摘要/topSignals" },
    { key: "format",           label: "报告格式化",         detail: "融合报告元数据和推荐列表" },
    { key: "verify_all",       label: "最终校验与包装",     detail: "完整性检查并输出" },
    { key: "output",           label: "推荐输出",           detail: "返回个性化推荐报告" },
  ],
  // 偏好画像分析 — 18 节点
  preference: [
    { key: "submit",           label: "接收偏好数据",       detail: "接收用户偏好记录" },
    { key: "clean",            label: "偏好数据整理",       detail: "过滤 ignored 偏好" },
    { key: "route_check",      label: "偏好数据路由",       detail: "有数据继续，无数据返回" },
    { key: "empty_end",        label: "无活跃偏好输出",     detail: "返回空报告" },
    { key: "status_classify",  label: "偏好状态分类",       detail: "按 confirmed/pending 分组" },
    { key: "type_classify",    label: "偏好类型细分",       detail: "按 like/avoid 四象限细分" },
    { key: "theme_classify",   label: "偏好主题归类",       detail: "映射到美食/自然/文化等主题" },
    { key: "conflict_check",   label: "偏好冲突检测",       detail: "检测 likes 和 avoids 矛盾" },
    { key: "signal_strength",  label: "信号强度评分",       detail: "计算每条偏好信号强度" },
    { key: "extract_tags",     label: "偏好标签提取",       detail: "提取代表性旅行标签" },
    { key: "analyze",          label: "用户画像分析",       detail: "生成画像描述和风格类型" },
    { key: "questions",        label: "待确认问题生成",     detail: "生成待追问的问题列表" },
    { key: "confidence",       label: "综合置信度评估",     detail: "计算画像完整性和可靠性" },
    { key: "report",           label: "画像报告生成",       detail: "汇总为完整结构化报告" },
    { key: "verify",           label: "报告结果校验",       detail: "校验 JSON 结构和字段类型" },
    { key: "format",           label: "报告格式化",         detail: "美化 JSON 格式" },
    { key: "wrap",             label: "最终包装输出",       detail: "添加 schema_version" },
    { key: "output",           label: "画像输出",           detail: "返回画像报告" },
  ],
  // 目的地详情 — 20 节点
  detail: [
    { key: "submit",           label: "接收目的地参数",     detail: "接收目的地对象和偏好" },
    { key: "validate",         label: "参数校验",           detail: "校验 name 必填和类型" },
    { key: "route_check",      label: "参数合法性路由",     detail: "合法继续，不合法返回" },
    { key: "error_end",        label: "参数错误结束",       detail: "返回错误信息" },
    { key: "kb_lookup",        label: "目的地知识检索",     detail: "查询知识库目的地详情" },
    { key: "weather",          label: "获取实时气候数据",   detail: "查询当前天气气候" },
    { key: "season_analysis",  label: "季节与最佳时间分析", detail: "分析最佳旅行季节" },
    { key: "pref_match",       label: "用户偏好匹配分析",   detail: "提取 likes/avoids 信号" },
    { key: "build_context",    label: "目的地画像构建",     detail: "整合所有上下文数据" },
    { key: "extract_features", label: "目的地关键特征提取", detail: "提取景点/美食/文化特征" },
    { key: "suitability",      label: "适合度与亮点分析",   detail: "生成适合度/亮点/风险" },
    { key: "geo_route",        label: "地理与路线规划",     detail: "生成地理特征和游览路线" },
    { key: "practical",        label: "预算与实用信息生成", detail: "生成预算/避坑/对比信息" },
    { key: "polish",           label: "段落内容润色",       detail: "统一三段内容的语言风格" },
    { key: "merge",            label: "所有内容聚合",       detail: "合并为统一目的地详情" },
    { key: "verify_fields",    label: "必填字段校验",       detail: "校验 name/summary 必填" },
    { key: "verify_arrays",    label: "数组字段校验",       detail: "校验 6 个数组字段类型" },
    { key: "quality",          label: "内容质量评分",       detail: "基于字段填充比例评分" },
    { key: "format",           label: "格式化与包装输出",   detail: "添加 schema_version" },
    { key: "output",           label: "详情输出",           detail: "返回目的地详情 JSON" },
  ],
  // AI 对话 — 22 节点（匹配 Dify Chatflow 完整工作流）
  chat: [
    { key: "receive",          label: "接收用户消息",       detail: "获取用户输入和偏好上下文" },
    { key: "compress",         label: "会话历史压缩",       detail: "压缩长对话历史节省 token" },
    { key: "classify",         label: "用户意图分类",       detail: "LLM 识别行程/偏好/通用三类意图" },
    { key: "route",            label: "意图路由",           detail: "按分类结果分支到对应处理链" },
    { key: "extract_trip",     label: "提取行程约束",       detail: "从消息中提取目的地/天数/预算" },
    { key: "kb_trip",          label: "检索目的地知识",     detail: "知识库查询目的地信息" },
    { key: "weather_trip",     label: "获取气候数据",       detail: "查询目的地当前天气气候" },
    { key: "compose_trip",     label: "生成初步方案",       detail: "LLM 生成行程建议初稿" },
    { key: "check_complete",   label: "信息完整性检查",     detail: "检查是否缺少关键参数" },
    { key: "route_complete",   label: "信息充分性路由",     detail: "完整则输出，不完整则追问" },
    { key: "answer_trip",      label: "输出完整建议",       detail: "返回结构化行程建议" },
    { key: "ask_followup",     label: "输出含追问的建议",   detail: "返回建议并追问缺失信息" },
    { key: "extract_pref",     label: "识别新偏好",         detail: "从消息中提取 likes/avoids" },
    { key: "validate_pref",    label: "偏好格式校验",       detail: "校验偏好 JSON 结构" },
    { key: "confirm_pref",     label: "生成偏好确认话术",   detail: "LLM 生成确认回执" },
    { key: "answer_pref",      label: "输出偏好确认",       detail: "返回偏好确认消息" },
    { key: "analyze_general",  label: "深度分析需求",       detail: "LLM 分析通用咨询问题" },
    { key: "kb_general",       label: "检索相关知识",       detail: "知识库检索通用知识" },
    { key: "data_general",     label: "获取实时数据",       detail: "查询签证/汇率等实时数据" },
    { key: "compose_general",  label: "生成顾问建议",       detail: "LLM 生成通用顾问回答" },
    { key: "sensitive_check",  label: "敏感内容检查",       detail: "检查回答安全性" },
    { key: "answer_general",   label: "输出建议",           detail: "返回最终顾问回答" },
  ],
};

function resetWorkflowProgress(type = "trip") {
  const steps = (WORKFLOW_STEPS[type] || WORKFLOW_STEPS.trip).map(s => ({
    ...s,
    status: "pending",
    startedAt: null,
    completedAt: null,
    duration: null,
    tokens: null,
  }));
  state.workflowProgress = {
    visible: false,
    status: "idle",
    type: type,
    steps,
    fallback: null,
    startedAt: null,
    workflowRunId: "",
  };
}

function initWorkflowProgress(type = "trip") {
  const steps = (WORKFLOW_STEPS[type] || WORKFLOW_STEPS.trip).map(s => ({
    ...s,
    status: "pending",
    startedAt: null,
    completedAt: null,
    duration: null,
    tokens: null,
  }));
  state.workflowProgress = {
    visible: true,
    status: "running",
    type: type,
    steps,
    fallback: null,
    startedAt: Date.now(),
    workflowRunId: "",
  };
}

function updateWorkflowStep(key, status, extra = {}) {
  const step = state.workflowProgress.steps.find(s => s.key === key);
  if (!step) return;
  const prevStatus = step.status;
  step.status = status;
  // Track step timing
  if (status === "running" && prevStatus !== "running") {
    step.startedAt = Date.now();
    step.completedAt = null;
  } else if (status === "completed" && step.startedAt) {
    step.completedAt = Date.now();
    const elapsed = step.completedAt - step.startedAt;
    step.duration = elapsed < 1000 ? elapsed + "ms" : (elapsed / 1000).toFixed(1) + "s";
  } else if (status === "failed" && step.startedAt) {
    step.completedAt = Date.now();
    const elapsed = step.completedAt - step.startedAt;
    step.duration = elapsed < 1000 ? elapsed + "ms" : (elapsed / 1000).toFixed(1) + "s";
  }
  // Capture tokens if provided from backend
  if (extra.tokens) {
    step.tokens = extra.tokens;
  }
  updateWorkflowStepperDom();
  // 如果聊天 workflow 卡片在 DOM 中, 也实时更新它
  if (state.workflowProgress.type === "chat") {
    updateChatWorkflowCardDom();
  }
}

function handleWorkflowEvent(event) {
  if (event.event === "workflow") {
    state.workflowProgress.status = "running";
    state.workflowProgress.workflowRunId = event.data.workflow_run_id || "";
    // 如果后端传了 workflow_type，更新步骤数组匹配
    const wfType = event.data.workflow_type || state.workflowProgress.type || "trip";
    if (wfType !== state.workflowProgress.type) {
      state.workflowProgress.type = wfType;
      state.workflowProgress.steps = (WORKFLOW_STEPS[wfType] || WORKFLOW_STEPS.trip).map(s => ({
        ...s,
        status: "pending",
        startedAt: null,
        completedAt: null,
        duration: null,
        tokens: null,
      }));
    }
    updateWorkflowStepperDom();
  } else if (event.event === "step") {
    updateWorkflowStep(event.data.key, event.data.status, { tokens: event.data.tokens });
  } else if (event.event === "fallback") {
    state.workflowProgress.fallback = event.data.label || "正在切换备用生成引擎";
    state.workflowProgress.steps.forEach(s => {
      if (s.status === "pending" || s.status === "running") {
        s.status = "skipped";
      }
    });
    updateWorkflowStepperDom();
  } else if (event.event === "complete") {
    state.workflowProgress.status = "completed";
    state.workflowProgress.completedAt = Date.now();
    const totalElapsed = state.workflowProgress.completedAt - (state.workflowProgress.startedAt || state.workflowProgress.completedAt);
    state.workflowProgress.totalDuration = totalElapsed < 1000 ? totalElapsed + "ms" : (totalElapsed / 1000).toFixed(1) + "s";
    state.workflowProgress.steps.forEach(s => {
      if (s.status === "pending" || s.status === "running") {
        s.status = "completed";
        if (s.startedAt) {
          s.completedAt = Date.now();
          const elapsed = s.completedAt - s.startedAt;
          s.duration = elapsed < 1000 ? elapsed + "ms" : (elapsed / 1000).toFixed(1) + "s";
        }
      }
    });
    updateWorkflowStepperDom();
    return event.data.plan;
  } else if (event.event === "error") {
    state.workflowProgress.status = "error";
    state.workflowProgress.fallback = event.data.message || "工作流执行失败";
    updateWorkflowStepperDom();
  }
  return null;
}

function updateWorkflowStepperDom() {
  const el = document.getElementById("workflow-stepper");
  if (!el) return;
  el.innerHTML = renderWorkflowStepperInner();
}

function renderWorkflowStepper() {
  if (!state.workflowProgress.visible) return "";
  return `<div id="workflow-stepper" class="wf-stepper" aria-live="polite" aria-label="行程生成进度">${renderWorkflowStepperInner()}</div>`;
}

function renderWorkflowStepperInner() {
  const { steps, status, fallback, totalDuration } = state.workflowProgress;
  const isActive = status === "running";
  const isDone = status === "completed";
  const hasFailed = status === "error";

  // Calculate overall elapsed time for running workflows
  let overallDuration = totalDuration || "";
  if (!overallDuration && isActive && state.workflowProgress.startedAt) {
    const elapsed = Date.now() - state.workflowProgress.startedAt;
    overallDuration = elapsed < 1000 ? elapsed + "ms" : (elapsed / 1000).toFixed(1) + "s";
  }

  const stepItems = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    const cls = `ws-step ws-${step.status}`;
    // ReactBits-style dots and connectors
    const dot = step.status === "completed"
      ? `<span class="ws-dot done"><svg width="10" height="10" viewBox="0 0 16 16"><polyline points="3 8 6.5 12 13 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
      : step.status === "failed"
      ? `<span class="ws-dot fail"><svg width="8" height="8" viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></span>`
      : step.status === "running"
      ? `<span class="ws-dot active"><span class="ws-ring"></span><span class="ws-core"></span></span>`
      : `<span class="ws-dot pending"></span>`;

    // Step duration and tokens
    const metaHtml = [];
    if (step.duration) {
      metaHtml.push(`<span class="ws-meta ws-meta-time">${icon("clock")}${esc(step.duration)}</span>`);
    }
    if (step.tokens) {
      metaHtml.push(`<span class="ws-meta ws-meta-tokens">${esc(step.tokens)}</span>`);
    }

    return `<div class="${cls}">
      <div class="ws-indicator">${dot}${isLast ? "" : `<span class="ws-line ${step.status === "completed" ? "done" : ""}"></span>`}</div>
      <div class="ws-content">
        <span class="ws-label">${esc(step.label)}${metaHtml.length ? `<span class="ws-meta-group">${metaHtml.join("")}</span>` : ""}</span>
        ${step.detail ? `<span class="ws-detail">${esc(step.detail)}</span>` : ""}
      </div>
    </div>`;
  }).join("");

  const statusIcon = isDone ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`
    : hasFailed ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"/></svg>`
    : `<span class="ws-spinner"></span>`;

  const statusLabel = isDone ? "生成完成" : hasFailed ? "生成失败" : "正在生成行程…";

  return `<div class="ws-card ${isActive ? "running" : ""} ${isDone ? "done" : ""} ${hasFailed ? "error" : ""}">
    <div class="ws-head">
      <span class="ws-status-icon">${statusIcon}</span>
      <span class="ws-status-label">${statusLabel}</span>
    </div>
    <div class="ws-body">${stepItems}</div>
    ${overallDuration ? `<div class="ws-total-time">总耗时 ${esc(overallDuration)}</div>` : ""}
    ${fallback ? `<div class="ws-fallback">${esc(fallback)}</div>` : ""}
  </div>`;
}

/**
 * 流式行程生成 - 使用 fetch ReadableStream 接收 SSE
 */
async function makePlanStream() {
  const destination = document.getElementById("pd")?.value || selectedDestination().name;
  const count = Math.max(1, Math.min(14, Number(document.getElementById("days")?.value || 5)));
  const budget = document.getElementById("budget")?.value || "均衡";
  const pace = document.getElementById("pace")?.value || "慢游";

  // 取消旧请求
  if (state.workflowController) {
    state.workflowController.abort();
  }
  state.workflowController = new AbortController();

  state.pendingPlanDestination = destination;
  state.planningDraft = { destination, count, budget, pace };

  initWorkflowProgress("trip");
  setLoading("plan", true);
  render();

  try {
    const headers = { "Content-Type": "application/json" };

    const response = await fetch(endpoint("trips/generate-stream"), {
      method: "POST",
      headers,
      body: JSON.stringify({ destination, days: count, budget, pace, tags: state.plannerTags }),
      signal: state.workflowController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`生成接口返回 HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalPlan = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (!event) continue;
        const plan = handleWorkflowEvent(event);
        if (plan) finalPlan = plan;
      }
    }

    // 处理剩余 buffer
    if (buffer.trim()) {
      const event = parseSseBlock(buffer);
      if (event) {
        const plan = handleWorkflowEvent(event);
        if (plan) finalPlan = plan;
      }
    }

    if (finalPlan) {
      const plan = normalizePlan(finalPlan);
      state.plans.unshift(plan);
      savePlanToHistory(plan);
      state.plansLoaded = true;
      toast(finalPlan.provider === "dify-workflow" ? "Dify 工作流已生成结构化行程。" : "AI 已生成结构化行程。", "success");
    } else {
      // 流式未返回完整 plan，回退到阻塞式
      throw new Error("流式未返回完整行程");
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    // 回退到阻塞式
    try {
      const result = await apiJson("trips/generate", {
        destination, days: count, budget, pace, tags: state.plannerTags,
      });
      const plan = normalizePlan(result.plan);
      state.plans.unshift(plan);
      savePlanToHistory(plan);
      state.plansLoaded = true;
      // 更新 Stepper 为回退完成
      state.workflowProgress.steps.forEach(s => {
        if (s.status === "pending" || s.status === "running") s.status = "skipped";
      });
      state.workflowProgress.status = "completed";
      state.workflowProgress.fallback = "已通过备用引擎完成生成";
      toast(result.plan?.fallback ? "已用本地规则生成结构化行程。" : result.plan?.provider === "dify-workflow" ? "Dify 工作流已生成行程。" : "AI 已生成结构化行程。", result.plan?.fallback ? "warn" : "success");
    } catch (fallbackError) {
      toast(fallbackError.message || "行程生成接口不可用。", "warn");
      state.workflowProgress.status = "error";
    }
  } finally {
    state.planningDraft = null;
    state.pendingPlanDestination = "";
    state.workflowController = null;
    setLoading("plan", false);
    render();
  }
}

/**
 * 通用 SSE 流式工作流消费函数。
 * 连接后端 SSE 端点，解析事件，驱动 workflowProgress stepper，返回最终 plan。
 */
async function consumeWorkflowStream(apiPath, body, type, onPlan) {
  if (state.workflowController) {
    state.workflowController.abort();
  }
  state.workflowController = new AbortController();

  initWorkflowProgress(type);
  setLoading("workflow", true);
  render();

  try {
    const headers = { "Content-Type": "application/json" };
    const response = await fetch(endpoint(apiPath), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: state.workflowController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`流式接口返回 HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalPlan = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (!event) continue;
        const plan = handleWorkflowEvent(event);
        if (plan) finalPlan = plan;
      }
    }

    if (buffer.trim()) {
      const event = parseSseBlock(buffer);
      if (event) {
        const plan = handleWorkflowEvent(event);
        if (plan) finalPlan = plan;
      }
    }

    if (finalPlan) {
      onPlan(finalPlan);
    } else {
      throw new Error("流式未返回完整结果");
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    state.workflowProgress.steps.forEach(s => {
      if (s.status === "pending" || s.status === "running") s.status = "skipped";
    });
    state.workflowProgress.status = "completed";
    state.workflowProgress.fallback = "流式连接失败，已转为备用处理";
    toast(error.message || "处理失败", "warn");
  } finally {
    state.workflowController = null;
    setLoading("workflow", false);
    render();
  }
}

/**
 * 流式推荐刷新 - 带 Stepper 进度显示
 */
async function refreshRecommendationsStream(force = false) {
  setLoading("recommend", true);
  try {
    await consumeWorkflowStream("recommend/stream", { force },
      "recommend",
      (plan) => {
        state.recommendations = plan.recommendations || [];
        state.preferenceReport = plan.report || plan;
        state.recommendationsLoaded = true;
        const count = state.recommendations.length;
        toast(force
          ? (count ? `Dify 已生成 ${count} 条推荐。` : "Dify 工作流完成，暂无可推荐目的地。")
          : (count ? "推荐已刷新。" : "暂无推荐数据。"), 
          count ? "success" : "info");
      }
    );
  } finally {
    setLoading("recommend", false);
  }
}

/**
 * 流式偏好画像分析 - 带 Stepper 进度显示
 */
async function refreshPreferenceStream() {
  await consumeWorkflowStream("preferences/stream", {},
    "preference",
    (plan) => {
      state.preferenceReport = plan;
      toast("偏好画像已通过 Dify 重新分析。", "success");
    }
  );
}

/**
 * 流式目的地详情 - 带 Stepper 进度显示
 */
async function refreshDetailStream(destination, force = false) {
  await consumeWorkflowStream("destinations/detail-stream",
    { destination, destination_name: destination?.name || "", force },
    "detail",
    (plan) => {
      state.destinationDetail = plan;
      toast("目的地详情已通过 Dify 生成。", "success");
    }
  );
}

function parseSseBlock(block) {
  const lines = block.split(/\r?\n/);
  let eventType = "";
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) return null;
  try {
    const data = JSON.parse(dataLines.join(""));
    return { event: eventType, data };
  } catch {
    return null;
  }
}


async function sendAiStream(message, conversationId = "") {
  state.advisorDraft = "";
  writeJson("shiguang-advisor-draft", "");

  // 取消旧流
  if (state.chatController) {
    state.chatController.abort();
  }
  state.chatController = new AbortController();

  state.aiExpanded = true;
  state.aiStickToBottom = true;

  // 添加用户消息
  state.messages.push({ role: "user", text: message });
  persistChat();

  // 创建待回复的 assistant 消息（不再使用内联 trace，改用 workflowProgress stepper）
  const assistantMsg = {
    role: "assistant",
    text: "",
    conversationId: conversationId,
  };
  state.messages.push(assistantMsg);
  setLoading("ai", true);

  // 初始化 Dify 工作流 Stepper
  initWorkflowProgress("chat");
  render();

  try {
    const headers = { "Content-Type": "application/json" };

    const response = await fetch(endpoint("ai/chat-stream"), {
      method: "POST",
      headers,
      body: JSON.stringify({ message, conversation_id: conversationId, current_route: "advisor" }),
      signal: state.chatController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`聊天流式接口返回 HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";
    let gotDone = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (!event) continue;

        if (event.event === "message") {
          const delta = event.data.content || "";
          fullText += delta;
          const last = state.messages[state.messages.length - 1];
          if (last && last.role === "assistant") {
            last.text = fullText;
            last.conversationId = event.data.conversation_id || conversationId;
          }
          updateChatMessageDom();
        } else if (event.event === "step") {
          // 驱动 workflowProgress Stepper
          updateWorkflowStep(event.data.key, event.data.status);
        } else if (event.event === "done") {
          gotDone = true;
          const last = state.messages[state.messages.length - 1];
          if (last && last.role === "assistant") {
            last.conversationId = event.data.conversation_id || last.conversationId;
          }
          state.workflowProgress.status = "completed";
          state.workflowProgress.steps.forEach(s => {
            if (s.status === "pending" || s.status === "running") s.status = "completed";
          });
          updateWorkflowStepperDom();
          updateChatMessageDom();
        } else if (event.event === "error") {
          state.workflowProgress.status = "error";
          state.workflowProgress.fallback = event.data.message || "工作流执行失败";
          updateWorkflowStepperDom();
          toast(event.data.message || "聊天接口错误。", "warn");
          updateChatMessageDom();
        } else if (event.event === "fallback") {
          state.workflowProgress.fallback = event.data.label || "正在切换备用生成引擎";
          state.workflowProgress.steps.forEach(s => {
            if (s.status === "pending" || s.status === "running") s.status = "skipped";
          });
          updateWorkflowStepperDom();
          if (event.data.error) {
            toast("Dify 连接失败: " + event.data.error, "warn");
          } else {
            toast(event.data.label || "AI 服务暂时不可用，使用备用回复。", "warn");
          }
        }
      }
    }

    // 剩余 buffer
    if (buffer.trim()) {
      const event = parseSseBlock(buffer);
      if (event && event.event === "message") {
        const last = state.messages[state.messages.length - 1];
        if (last && last.role === "assistant") {
          last.text = event.data.content || "";
        }
      }
    }

    if (!gotDone) {
      // 流结束但没收到 done，手动补全
      state.workflowProgress.status = "completed";
      state.workflowProgress.steps.forEach(s => {
        if (s.status === "pending" || s.status === "running") s.status = "completed";
      });
      updateWorkflowStepperDom();
    }

    persistChat();
  } catch (error) {
    if (error.name === "AbortError") return;
    // 回退到阻塞式
    state.workflowProgress.fallback = "流式连接失败，已转为备用处理";
    state.workflowProgress.steps.forEach(s => {
      if (s.status === "pending" || s.status === "running") s.status = "skipped";
    });
    state.workflowProgress.status = "completed";
    updateWorkflowStepperDom();
    try {
      const result = await apiJson("ai/chat", { message, conversation_id: conversationId, current_route: "advisor" });
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        last.text = result.message?.content || "我已经记住这条偏好，会在推荐里动态调整。";
        last.conversationId = result.message?.conversationId || conversationId;
      }
      if (result.memory) state.preferences = [result.memory, ...state.preferences.filter((item) => item.id !== result.memory.id)];
      persistChat();
      toast("AI 已回复。", "success");
    } catch (fallbackError) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        last.text = `接口暂时不可用，我先按本地画像给你建议。${fallbackError.message || ""}`;
      }
      persistChat();
      toast("AI 接口失败，已使用本地兜底。", "warn");
    }
  } finally {
    state.chatController = null;
    setLoading("ai", false);
    render();
  }
}

/**
 * 更新聊天消息 DOM — 只更新最后一条 assistant 消息的文本内容（不重新渲染整个列表）
 */
function updateChatMessageDom() {
  const msgsEl = document.querySelector(".advisor-msgs");
  if (!msgsEl) return;
  const lastMsgEl = msgsEl.lastElementChild;
  if (!lastMsgEl || !lastMsgEl.classList.contains("assistant")) return;
  const last = state.messages[state.messages.length - 1];
  if (!last || last.role !== "assistant") return;
  const textEl = lastMsgEl.querySelector(".advisor-bubble > p");
  if (textEl) {
    textEl.textContent = last.text;
  }
  // 自动滚到底
  if (state.aiStickToBottom) {
    const body = lastMsgEl.closest(".advisor-body") || document.querySelector(".advisor-body");
    if (body) body.scrollTop = body.scrollHeight;
  }
}

async function makePlan() {
  // 优先尝试流式生成
  if (typeof ReadableStream !== "undefined" && window.fetch) {
    return makePlanStream();
  }
  // 非流式兜底
  const destination = document.getElementById("pd")?.value || selectedDestination().name;
  const count = Math.max(1, Math.min(14, Number(document.getElementById("days")?.value || 5)));
  const budget = document.getElementById("budget")?.value || "均衡";
  const pace = document.getElementById("pace")?.value || "慢游";
  state.pendingPlanDestination = destination;
  state.planningDraft = { destination, count, budget, pace };
  setLoading("plan", true);
  try {
    const result = await apiJson("trips/generate", {
      destination,
      days: count,
      budget,
      pace,
      tags: state.plannerTags,
    });
    const plan = normalizePlan(result.plan);
    state.plans.unshift(plan);
    savePlanToHistory(plan);
    state.plansLoaded = true;
    const provider = result.plan?.provider || "";
    if (result.plan?.fallback) {
      toast("已用本地规则生成结构化行程。", "warn");
    } else if (provider === "dify-workflow") {
      toast("Dify 工作流已生成结构化行程。", "success");
    } else {
      toast("AI 已生成结构化行程。", "success");
    }
  } catch (error) {
    toast(error.message || "行程生成接口不可用。", "warn");
  } finally {
    state.planningDraft = null;
    state.pendingPlanDestination = "";
    setLoading("plan", false);
  }
}

async function loadTripPlans() {
  setLoading("planHistory", true);
  try {
    const result = await apiJson("trips/plans");
    const remotePlans = (result.plans || []).map((plan, index) => normalizePlan({ ...plan, id: plan.id || `remote_${index}` }, index));
    state.planHistory = [...state.planHistory, ...remotePlans].reduce((list, plan) => {
      return list.some((item) => item.id === plan.id) ? list : [...list, plan];
    }, []).slice(0, 30);
    writeJson("shiguang-trip-plans", state.planHistory);
    state.plansLoaded = true;
    state.planHistoryOpen = true;
    render();
  } catch {
    state.planHistoryOpen = true;
    render();
    toast("远程历史接口不可用，已显示本地历史。", "warn");
  } finally {
    setLoading("planHistory", false);
  }
}

function exportPlan() {
  const plan = state.plans[0] || defaultPlan();
  const dayText = (plan.days || []).map((day, index) => {
    if (typeof day === "string") return `DAY ${index + 1}: ${day}`;
    return [
      `DAY ${index + 1}: ${day.title || `第 ${index + 1} 天`}`,
      `上午：${day.morning || day.am || ""}`,
      `下午：${day.afternoon || day.pm || ""}`,
      `晚上：${day.evening || day.night || ""}`,
      day.notes ? `提醒：${day.notes}` : "",
    ].filter(Boolean).join("\n");
  });
  const text = [`${plan.title}`, `预算约 ¥${plan.estimate}`, plan.overview, "", ...dayText].join("\n\n");
  downloadFile(`${plan.title}.txt`, text, "text/plain;charset=utf-8");
  toast("行程文本已导出。", "success");
}

function addCalendar() {
  const plan = state.plans[0] || defaultPlan();
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shiguang Travel Vision//CN", "BEGIN:VEVENT", `UID:${Date.now()}@shiguang`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, `SUMMARY:${plan.title}`, `DESCRIPTION:${plan.overview}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  downloadFile(`${plan.title}.ics`, ics, "text/calendar;charset=utf-8");
  toast("日历文件已生成。", "success");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function loadRecommendations(force = false) {
  // 尝试流式 Dify 推荐（显示 Stepper 进度），如果 Dify 未配置则回退到阻塞式
  const difyEnabled = bootstrap.settingsPublic?.dify?.enabled && bootstrap.settingsPublic?.dify?.configured;
  if (difyEnabled) {
    await refreshRecommendationsStream(force);
    return;
  }
  setLoading("recommend", true);
  try {
    const result = await apiJson("destinations/recommend", { force });
    state.recommendations = result.recommendations || [];
    state.preferenceReport = result.report || null;
    state.recommendationsLoaded = true;
    const count = state.recommendations.length;
    toast(force
      ? (count ? `已生成 ${count} 条推荐。` : "暂无推荐目的地，请先在 AI 顾问中表达偏好。")
      : (count ? "推荐已按偏好报告读取。" : "暂无推荐数据，与 AI 顾问对话可逐步积累。"), 
      count ? "success" : "info");
  } catch {
    toast("推荐接口不可用，请检查 Dify 配置。", "warn");
  } finally {
    setLoading("recommend", false);
  }
}

async function loadDestinationMedia(destination, scene = "place", perPage = 8) {
  const cached = state.destinationMedia[destination?.id] || [];
  const hasLiveImage = cached.some((item) => item?.url);
  // 如果已有图片则跳过；如果正在加载则跳过；否则始终尝试加载
  if (!destination?.id || hasLiveImage || state.loading[`media-${destination.id}`]) return;
  state.mediaAttempts[destination.id] = true;
  state.loading[`media-${destination.id}`] = true;
  render();
  try {
    const result = await apiJson("media/search", {
      query: destinationMediaQuery(destination),
      destinationId: destination.id,
      scene,
      perPage,
    });
    if (Array.isArray(result.images) && result.images.length) {
      state.destinationMedia[destination.id] = result.images;
      writeJson("shiguang-destination-media", state.destinationMedia);
      if (state.route === "/" && state.amap?.instance) refreshExploreMediaSurfaces();
      else render();
    } else {
      state.destinationMedia[destination.id] = [{ fallback: true }];
      state.loading[`media-${destination.id}`] = false;
      if (state.route === "/" && state.amap?.instance) refreshExploreMediaSurfaces();
      else render();
    }
  } catch (e) {
    // Keep the CSS fallback while the configured providers are unavailable.
    state.destinationMedia[destination.id] = [{ fallback: true }];
    state.loading[`media-${destination.id}`] = false;
    if (state.route === "/" && state.amap?.instance) refreshExploreMediaSurfaces();
    else render();
  } finally {
    state.loading[`media-${destination.id}`] = false;
  }
}

function loadVisibleDestinationMedia(route) {
  const visible = route.startsWith("/destination/")
    ? [routeDestination(route)]
    : route.startsWith("/memory/")
      ? [recordMemoryDestination(memoryRecordFromRoute(route).record)]
    : route === "/wishlist"
      ? state.wished.map((id) => destinations.find((d) => d.id === id)).filter(Boolean)
      : route === "/recommend"
        ? visibleRecommendations().map((item) => item.destination).filter(Boolean)
        : destinations;
  visible.forEach((destination, index) => setTimeout(() => loadDestinationMedia(destination, "place", 6), index * 120));
}

function loadMemoryRecordMedia() {
  const records = state.tripRecords.length ? state.tripRecords : bootstrap.tripRecords || [];
  records.forEach((record, index) => {
    setTimeout(() => loadDestinationMedia(recordMemoryDestination(record), "memory", 3), index * 120);
  });
}

async function loadPreferences() {
  setLoading("preferences", true);
  try {
    const result = await apiJson("preferences/list");
    state.preferences = result.preferences || [];
    // 偏好变化后刷新推荐
    state.recommendationsLoaded = false;
    loadRecommendations(true);
    toast("偏好已同步。", "success");
  } catch {
    toast("偏好接口不可用。", "warn");
  } finally {
    setLoading("preferences", false);
  }
}

async function addPreference() {
  const detail = document.getElementById("preferenceInput")?.value || "";
  const type = document.getElementById("preferenceType")?.value || "general";
  if (!detail.trim()) {
    toast("请先写入偏好内容。", "warn");
    return;
  }
  setLoading("preferences", true);
  try {
    const result = await apiJson("preferences/upsert", { detail, type, source: "manual", status: "pending" });
    state.preferences = [result.preference, ...state.preferences.filter((item) => item.id !== result.preference.id)];
    state.recommendationsLoaded = false;
    state.recommendations = [];
    toast("偏好已写入，等待确认。", "success");
  } catch {
    toast("偏好写入失败。", "warn");
  } finally {
    setLoading("preferences", false);
  }
}

async function setPreference(id, status) {
  try {
    const result = await apiJson("preferences/confirm", { id, status });
    state.preferences = state.preferences.map((item) => item.id === id ? result.preference : item).filter((item) => item.id !== id || (item.status || "pending") === "pending");
    state.recommendationsLoaded = false;
    state.recommendations = [];
    toast(status === "confirmed" ? "偏好已确认。" : "偏好已忽略。", "success");
  } catch {
    toast("偏好状态更新失败。", "warn");
  }
}

async function deletePreference(id) {
  try {
    await apiJson("preferences/delete", { id });
    state.preferences = state.preferences.filter((item) => item.id !== id);
    state.recommendationsLoaded = false;
    state.recommendations = [];
    toast("偏好已删除。", "success");
  } catch {
    toast("删除失败。", "warn");
  }
}

async function loadAdminStats() {
  try {
    const result = await apiJson("admin/stats");
    state.adminStats = result.stats;
    toast("后台数据已刷新。", "success");
  } catch (error) {
    toast(error.message || "后台统计接口不可用。", "warn");
  }
  render();
}

async function loadAdminUsers() {
  setLoading("users", true);
  try {
    const result = await apiJson("admin/users");
    state.users = result.users || [];
  } catch (error) {
    toast(error.message || "用户列表读取失败。", "warn");
  } finally {
    setLoading("users", false);
  }
}

async function loadAdminPreferences() {
  setLoading("adminPreferences", true);
  try {
    const result = await apiJson("admin/preferences");
    state.adminPreferences = result.preferences || [];
  } catch (error) {
    toast(error.message || "偏好审核列表读取失败。", "warn");
  } finally {
    setLoading("adminPreferences", false);
  }
}

async function adminSetPreference(id, status) {
  try {
    const result = await apiJson("admin/preferences/confirm", { id, status });
    state.adminPreferences = state.adminPreferences.map((item) => item.id === id ? result.preference : item);
    state.preferences = state.preferences.map((item) => item.id === id ? result.preference : item);
    toast(status === "confirmed" ? "偏好已审核确认。" : "偏好已忽略。", "success");
    render();
  } catch (error) {
    toast(error.message || "偏好审核失败。", "warn");
  }
}

async function adminDeletePreference(id) {
  try {
    await apiJson("admin/preferences/delete", { id });
    state.adminPreferences = state.adminPreferences.filter((item) => item.id !== id);
    state.preferences = state.preferences.filter((item) => item.id !== id);
    toast("偏好已删除。", "success");
    render();
  } catch (error) {
    toast(error.message || "偏好删除失败。", "warn");
  }
}

async function adminLoadMedia(id) {
  const destination = destinations.find((item) => item.id === id);
  if (!destination) return toast("目的地不存在。", "warn");
  await loadDestinationMedia(destination, "gallery", 30);
  toast((state.destinationMedia[id] || []).length ? "图片素材已更新。" : "没有获取到图片，请检查图源配置。", (state.destinationMedia[id] || []).length ? "success" : "warn");
}

function adminClearMedia(id) {
  delete state.destinationMedia[id];
  writeJson("shiguang-destination-media", state.destinationMedia);
  toast("图片缓存已清除。", "success");
  render();
}

async function saveUser() {
  const payload = {
    id: document.getElementById("userId")?.value || "",
    name: document.getElementById("userName")?.value || "",
    email: document.getElementById("userEmail")?.value || "",
    role: document.getElementById("userRole")?.value || "user",
    status: document.getElementById("userStatus")?.value || "active",
    password: document.getElementById("userPassword")?.value || "",
    profile: {
      persona: document.getElementById("userPersona")?.value || "",
      budgetLevel: document.getElementById("userBudget")?.value || "",
      travelPace: document.getElementById("userPace")?.value || "",
      avoidances: document.getElementById("userAvoidances")?.value || "",
    },
  };
  setLoading("users", true);
  try {
    const result = await apiJson("admin/users/save", payload);
    state.users = [result.user, ...state.users.filter((user) => user.id !== result.user.id)];
    state.editingUserId = result.user.id;
    toast("用户已保存。", "success");
  } catch (error) {
    toast(error.message || "用户保存失败。", "warn");
  } finally {
    setLoading("users", false);
  }
}

async function saveAccount() {
  const payload = {
    name: document.getElementById("accountName")?.value || "",
    email: document.getElementById("accountEmail")?.value || "",
    currentPassword: document.getElementById("accountCurrentPassword")?.value || "",
    newPassword: document.getElementById("accountNewPassword")?.value || "",
    profile: {
      persona: document.getElementById("accountPersona")?.value || "",
      budgetLevel: document.getElementById("accountBudget")?.value || "",
      travelPace: document.getElementById("accountPace")?.value || "",
      avoidances: document.getElementById("accountAvoidances")?.value || "",
    },
  };
  setLoading("account", true);
  try {
    const result = await apiJson("auth/account", payload);
    state.currentUser = result.user;
    localStorage.setItem("shiguang-user", JSON.stringify(result.user));
    state.users = state.users.map((user) => user.id === result.user.id ? result.user : user);
    toast("账户安全设置已保存。", "success");
  } catch (error) {
    toast(error.message || "账户保存失败。", "warn");
  } finally {
    setLoading("account", false);
  }
}

async function deleteUser(id) {
  try {
    await apiJson("admin/users/delete", { id });
    state.users = state.users.filter((user) => user.id !== id);
    if (state.editingUserId === id) state.editingUserId = "";
    toast("用户已删除。", "success");
    render();
  } catch (error) {
    toast(error.message || "用户删除失败。", "warn");
  }
}

async function loadIntegrationSettings() {
  if (state.loading.integrations) {
    toast("正在读取配置，请稍候…", "info");
    return;
  }
  setLoading("integrations", true);
  try {
    const payload = await apiJson("settings");
    state.integrations = payload.settings;
    render();
    toast("配置已读取。", "success");
  } catch (error) {
    toast(error.message || "配置读取失败。", "warn");
  } finally {
    setLoading("integrations", false);
  }
}

async function saveIntegrationSettings() {
  const payload = {
    map: {
      provider: "高德地图",
      jsKey: document.getElementById("mapJsKey")?.value || "",
      securityJsCode: document.getElementById("mapSecurityJsCode")?.value || "",
      webServiceKey: document.getElementById("mapWebServiceKey")?.value || "",
    },
    unsplash: {
      accessKey: document.getElementById("unsplashAccessKey")?.value || "",
      secretKey: document.getElementById("unsplashSecretKey")?.value || "",
    },
    media: {
      pexelsApiKey: document.getElementById("pexelsApiKey")?.value || "",
      pixabayApiKey: document.getElementById("pixabayApiKey")?.value || "",
      apihzId: document.getElementById("apihzId")?.value || "",
      apihzKey: document.getElementById("apihzKey")?.value || "",
    },
    dify: {
      enabled: (document.getElementById("difyEnabled")?.value || "0") === "1",
      baseUrl: document.getElementById("difyBaseUrl")?.value || "",
      chatflowApiKey: document.getElementById("difyChatflowApiKey")?.value || "",
      tripWorkflowApiKey: document.getElementById("difyTripWorkflowApiKey")?.value || "",
      recommendWorkflowApiKey: document.getElementById("difyRecommendWorkflowApiKey")?.value || "",
      preferenceWorkflowApiKey: document.getElementById("difyPreferenceWorkflowApiKey")?.value || "",
      detailWorkflowApiKey: document.getElementById("difyDetailWorkflowApiKey")?.value || "",
      timeout: Math.max(5, Math.min(180, parseInt(document.getElementById("difyTimeout")?.value || "90", 10) || 90)),
    },
  };
  setLoading("integrations", true);
  try {
    const result = await apiJson("settings", payload);
    state.integrations = result.settings || payload;
    toast("配置已保存。", "success");
  } catch (error) {
    state.integrations = payload;
    toast(error.message || "保存失败，已暂存。", "warn");
  } finally {
    setLoading("integrations", false);
  }
}

async function runApiCheck() {
  const resultDiv = document.getElementById("apiCheckResult");
  if (!resultDiv) return;
  resultDiv.innerHTML = '<div class="setting-card" style="padding:20px;text-align:center;color:var(--muted)">⏳ 正在检查各 API 连通性…</div>';
  try {
    const data = await apiJson("check");
    const apis = data || {};
    const statusIcon = (ok) => ok ? "✅" : "❌";
    const rows = Object.entries(apis).map(([name, info]) => {
      const configOk = info.configured || false;
      const reachable = info.reachable;
      const detail = info.detail || "";
      let status;
      if (name === "dify") {
        status = configOk ? (reachable ? "✅ 连通" : "❌ " + detail) : "⏸️ 未配置";
      } else {
        status = configOk ? "✅ 已配置" : "⏸️ 未配置";
      }
      const extra = name === "dify" && configOk
        ? `<span class="muted" style="font-size:12px"> Chatflow Key: ${info.hasChatflowKey ? "✅" : "❌"} | Task Key: ${info.hasTaskKey ? "✅" : "❌"}</span>`
        : "";
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
        <span><b>${esc(name)}</b>${extra}</span>
        <span>${status}</span>
      </div>`;
    }).join("");
    resultDiv.innerHTML = `<div class="setting-card" style="padding:18px 22px">
      <div style="font-size:14px;font-weight:600;margin-bottom:8px">🔍 API 诊断结果</div>
      ${rows}
      <div class="muted" style="margin-top:10px;font-size:12px">诊断时间: ${new Date().toLocaleString()}</div>
    </div>`;
  } catch (error) {
    resultDiv.innerHTML = `<div class="setting-card" style="padding:18px 22px;border-color:var(--danger)">
      <b>❌ 诊断失败</b><p class="muted">${esc(error.message || "未知错误")}</p>
    </div>`;
  }
}

async function loadGallery(query) {
  state.loading.gallery = true;
  render();
  try {
    const destination = routeDestination();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const result = await apiJson("media/search", { query: query || destinationMediaQuery(destination), destinationId: destination.id, scene: "gallery", perPage: 20 }, controller.signal);
    clearTimeout(timer);
    state.galleryImages = result.images || [];
  } catch {
    state.galleryImages = [];
  } finally {
    state.loading.gallery = false;
  }
  render();
}

async function loadDestinationDetail(destination) {
  if (!destination?.id || state.destinationDetails[destination.id]?.detail || state.loading[`detail-${destination.id}`]) return;

  // 尝试流式 Dify 详情（显示 Stepper 进度）
  const difyEnabled = bootstrap.settingsPublic?.dify?.enabled && bootstrap.settingsPublic?.dify?.configured;
  if (difyEnabled) {
    state.loading[`detail-${destination.id}`] = true;
    render();
    await consumeWorkflowStream("destinations/detail-stream",
      { destination, destination_name: destination?.name || "", force: false },
      "detail",
      (plan) => {
        state.destinationDetails[destination.id] = { detail: plan, cached: false };
      }
    );
    if (state.destinationDetails[destination.id]?.detail) {
      state.loading[`detail-${destination.id}`] = false;
      render();
      return;
    }
    // 流式失败，降级到阻塞
    state.loading[`detail-${destination.id}`] = false;
  }

  state.loading[`detail-${destination.id}`] = true;
  render();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const body = { id: destination.id };
    if (destination.id === "map-picked") {
      body.name = destination.name;
      body.country = destination.country;
      body.region = destination.region;
      body.lat = destination.lat;
      body.lng = destination.lng;
      body.intro = destination.intro;
    }
    const result = await apiJson("destinations/detail", body, controller.signal);
    state.destinationDetails[destination.id] = { detail: result.detail, cached: result.cached };
  } catch (error) {
    if (error?.name !== "AbortError") {
      toast(error.message || "目的地详情生成失败。", "warn");
    }
  } finally {
    clearTimeout(timeout);
    state.loading[`detail-${destination.id}`] = false;
    render();
  }
}

function cleanupMap() {
  if (state.amap?.instance) {
    try { state.amap.instance.destroy(); } catch {}
  }
  state.amap = null;
}

function refreshMapPopup() {
  document.querySelector(".map-popup")?.remove();
  if (state.mapPopupOpen) {
    const hero = document.querySelector(".maphero");
    const dock = document.querySelector(".ai-dock");
    if (hero) (dock || hero).insertAdjacentHTML(dock ? "beforebegin" : "beforeend", mapPopup());
  }
  document.querySelectorAll(".amap-marker").forEach((node) => node.classList.remove("on"));
  const markerIndex = destinations.findIndex((destination) => destination.id === state.selectedId);
  if (markerIndex >= 0) document.querySelectorAll(".amap-marker")[markerIndex]?.classList.add("on");
}

function createPickedPlace(lng, lat, label = "", locality = {}) {
  const latText = Number.isFinite(lat) ? lat.toFixed(5) : "--";
  const lngText = Number.isFinite(lng) ? lng.toFixed(5) : "--";
  const nearbyCity = locality.city || locality.district || locality.province || "";
  return {
    id: "map-picked",
    name: label || "正在识别附近城市…",
    country: locality.province || "高德地图",
    region: locality.address || `${latText}, ${lngText}`,
    season: "即时选点",
    intro: nearbyCity ? `已定位到${nearbyCity}周边，可以带去 AI 顾问继续细化交通、住宿和停留时间。` : "正在根据经纬度查询周边城市，稍后会自动更新地点信息。",
    summary: "地图即时选点",
    budget: "待确认",
    days: 1,
    weight: 100,
    lng,
    lat,
    mediaQuery: locality.mediaQuery || `${label || nearbyCity} 旅游风景 实景摄影 自然风光 人文景观`,
    img: selectedDestination().img || "city",
    reason: "已记录当前位置经纬度，适合继续确认交通、住宿和附近可玩点。",
  };
}

async function loadPickedPlaceMedia(place) {
  if (!place || place.id !== "map-picked") return;
  const placeKey = `${place.lng},${place.lat}`;
  const existing = state.destinationMedia["map-picked"] || [];
  if (existing.some((img) => img?.url)) return;
  state.mapMediaController?.abort();
  const controller = new AbortController();
  state.mapMediaController = controller;
  state.mediaAttempts["map-picked"] = true;
  state.loading["media-map-picked"] = true;
  refreshMapPopup();
  try {
    const result = await apiJson("media/search", {
      query: place.mediaQuery || `${place.name} 旅游风景 实景摄影 自然风光 人文景观`,
      destinationId: "map-picked",
      scene: "map-picked",
      perPage: 6,
    }, controller.signal);
    if (currentPickedPlaceKey() !== placeKey) return;
    // 始终存储结果，不因坐标变动丢弃
    const images = Array.isArray(result.images) && result.images.length ? result.images : (existing.some((img) => img?.url) ? existing : [{ fallback: true }]);
    if (images.some((img) => img?.url) || !existing.some((img) => img?.url)) {
      state.destinationMedia["map-picked"] = images;
      // 如果在目的地详情页，刷新页面以显示图片
      if (state.route === "/destination/map-picked") render();
    }
  } catch (e) {
    if (e?.name !== "AbortError" && currentPickedPlaceKey() === placeKey && !existing.some((img) => img?.url)) {
      state.destinationMedia["map-picked"] = [{ fallback: true }];
    }
  } finally {
    if (state.mapMediaController === controller) {
      state.mapMediaController = null;
      state.loading["media-map-picked"] = false;
      state.mediaAttempts["map-picked"] = false;
      refreshMapPopup();
    }
  }
}

function currentPickedPlaceKey() {
  const place = state.mapPickedPlace;
  return place ? `${place.lng},${place.lat}` : "";
}

function pickMapPlaceFromDom(event) {
  const box = event.target?.closest(".world-map")?.getBoundingClientRect?.();
  if (!box) return closeMapPopup();
  const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
  const y = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
  pickMapPlace({ lnglat: { lng: x * 360 - 180, lat: 85 - y * 170 }, clientX: event.clientX });
}

/** 使用 OpenStreetMap Nominatim 进行反向地理编码（国外区域 fallback） */
async function reverseGeocodeNominatim(lng, lat) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=zh`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ShiguangTravelVision/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || "";
    const country = addr.country || "";
    const display = data.display_name || "";
    return { city, country, display, state: addr.state };
  } catch {
    return null;
  }
}

function pickMapPlace(event) {
  const raw = event?.lnglat || {};
  const lng = Number(raw.getLng?.() ?? raw.lng);
  const lat = Number(raw.getLat?.() ?? raw.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return closeMapPopup();
  const mapEl = document.querySelector(".world-map");
  if (mapEl) {
    const rect = mapEl.getBoundingClientRect();
    let clickX, clickY;
    if (typeof event.pixel?.getX === "function") {
      clickX = event.pixel.getX();
      clickY = event.pixel.getY();
    } else if (event.domEvent?.clientX) {
      clickX = event.domEvent.clientX - rect.left;
      clickY = event.domEvent.clientY - rect.top;
    } else if (event.clientX) {
      clickX = event.clientX - rect.left;
      clickY = event.clientY - rect.top;
    }
    state.popupSide = clickX !== undefined && clickX > rect.width * 0.5 ? "left" : "right";
    if (clickY !== undefined) {
      state.popupTop = Math.max(10, Math.min(clickY - 140, rect.height - 420));
    }
  }
  state.mapMediaController?.abort();
  state.mapMediaController = null;
  delete state.destinationMedia["map-picked"];
  delete state.destinationDetails["map-picked"];
  delete state.mediaAttempts["map-picked"];
  state.loading["media-map-picked"] = false;
  state.pendingDetailPlace = null;
  state.mapPickedPlace = createPickedPlace(lng, lat);
  state.mapPopupOpen = true;
  state.heroDismissed = true;
  state.planningTransition = false;
  document.querySelector(".maphero")?.classList.add("hero-faded");
  refreshMapPopup();
  setTimeout(() => document.querySelector(".map-popup")?.classList.add("entered"), 20);
  if (window.AMap?.Geocoder) {
    const geocoder = state.amap?.geocoder || new window.AMap.Geocoder();
    if (state.amap) state.amap.geocoder = geocoder;
    geocoder.getAddress([lng, lat], (status, result) => {
      const address = result?.regeocode?.formattedAddress;
      const addressComponent = result?.regeocode?.addressComponent || {};
      const city = Array.isArray(addressComponent.city) ? addressComponent.city[0] : addressComponent.city;
      const nearbyCity = city || addressComponent.district || addressComponent.province || address;
      if (status === "complete" && nearbyCity && state.mapPickedPlace?.lng === lng && state.mapPickedPlace?.lat === lat) {
        state.mapPickedPlace = createPickedPlace(lng, lat, `${nearbyCity}附近`, {
          city,
          district: addressComponent.district,
          province: addressComponent.province,
          address,
          mediaQuery: `${nearbyCity} ${addressComponent.province || ""} 旅游风景 实景摄影 自然风光 人文景观`,
        });
        refreshMapPopup();
        loadPickedPlaceMedia(state.mapPickedPlace);
      } else if (state.mapPickedPlace?.lng === lng && state.mapPickedPlace?.lat === lat) {
        // AMap 未能识别（常见于国外区域），改用 Nominatim
        reverseGeocodeNominatim(lng, lat).then((nom) => {
          if (!nom || state.mapPickedPlace?.lng !== lng || state.mapPickedPlace?.lat !== lat) {
            // 仍然失败，回退到坐标显示
            const fallbackLabel = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            state.mapPickedPlace = createPickedPlace(lng, lat, `${fallbackLabel}`, {
              mediaQuery: `自然风光 旅行实景摄影 scenic landscape ${lat.toFixed(1)}, ${lng.toFixed(1)}`,
            });
            refreshMapPopup();
            loadPickedPlaceMedia(state.mapPickedPlace);
            return;
          }
          const cityName = nom.city || nom.state || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
          state.mapPickedPlace = createPickedPlace(lng, lat, `${cityName}附近`, {
            city: nom.city,
            district: nom.state,
            province: nom.country,
            address: nom.display,
            mediaQuery: `${cityName} ${nom.country} 旅游风景 实景摄影 自然风光 人文景观`,
          });
          refreshMapPopup();
          loadPickedPlaceMedia(state.mapPickedPlace);
        });
      }
    });
  } else {
    loadPickedPlaceMedia(state.mapPickedPlace);
  }
}

function flyToPlanningDestination(destination) {
  const map = state.amap?.instance;
  if (!map || !Number.isFinite(Number(destination?.lng)) || !Number.isFinite(Number(destination?.lat))) return;
  document.querySelector(".maphero")?.classList.add("planning-flight");
  map.setZoomAndCenter(9, [destination.lng, destination.lat], false, 1000);
}

function selectMapDestination(id) {
  state.mapPickedPlace = null;
  state.pendingDetailPlace = null;
  state.selectedId = id;
  state.mapPopupOpen = true;
  state.heroDismissed = true;
  document.querySelector(".maphero")?.classList.add("hero-faded");
  state.planningTransition = false;
  const d = selectedDestination();
  if (state.amap?.instance && d.lng && d.lat) {
    const canvas = document.getElementById("amapCanvas");
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      state.popupSide = "right";
      state.popupTop = Math.max(14, Math.min(rect.height * 0.07, rect.height - 440));
    }
    state.amap.instance.setZoomAndCenter(Math.max(state.amap.instance.getZoom(), 4.2), [d.lng, d.lat], false, 760);
  }
  refreshMapPopup();
  setTimeout(() => document.querySelector(".map-popup")?.classList.add("entered"), 20);
  loadDestinationMedia(d, "place", 6);
}

function closeMapPopup() {
  state.mapPopupOpen = false;
  state.heroDismissed = true;
  document.querySelector(".maphero")?.classList.add("hero-faded");
  state.planningTransition = false;
  if (state.route === "/" && state.amap?.instance) {
    refreshMapPopup();
  } else {
    render();
  }
}

function amapStyle() {
  return state.theme === "dark" ? "amap://styles/darkblue" : "amap://styles/macaron";
}

function ensureAmapScript() {
  const settings = bootstrap.settingsPublic?.map || {};
  if (!settings.jsKey) return Promise.reject(new Error("未配置高德 JS Key"));
  window._AMapSecurityConfig = { securityJsCode: settings.securityJsCode || "" };
  if (window.AMap) return Promise.resolve(window.AMap);
  const existing = document.querySelector('script[data-amap-loader="true"]');
  if (existing) {
    if (existing.dataset.failed === "true") {
      existing.remove();
      return ensureAmapScript();
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.AMap), { once: true });
      existing.addEventListener("error", () => reject(new Error("高德地图脚本加载失败")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.amapLoader = "true";
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(settings.jsKey)}&plugin=AMap.Scale,AMap.ToolBar,AMap.Geocoder`;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => {
      script.dataset.failed = "true";
      script.remove();
      reject(new Error("高德地图脚本加载失败"));
    };
    document.head.appendChild(script);
  });
}

function ensureAmapControls() {
  if (window.AMap?.ToolBar && window.AMap?.Scale && window.AMap?.Geocoder) return Promise.resolve();
  return new Promise((resolve) => window.AMap.plugin(["AMap.ToolBar", "AMap.Scale", "AMap.Geocoder"], resolve));
}

async function initExploreMap() {
  const container = document.getElementById("amapCanvas");
  if (!container || state.amap?.container === container) return;
  try {
    await ensureAmapScript();
    await ensureAmapControls();
    if (!container.isConnected || document.getElementById("amapCanvas") !== container) return initExploreMap();
    const map = new window.AMap.Map(container, {
      zoom: 4.5,
      center: [104, 35],
      viewMode: "2D",
      mapStyle: amapStyle(),
      resizeEnable: true,
      showLabel: true,
      zoomEnable: true,
      dragEnable: true,
      doubleClickZoom: true,
      scrollWheel: true,
    });
    const toolbar = new window.AMap.ToolBar({ position: "LT", liteStyle: true });
    const scale = new window.AMap.Scale();
    map.addControl(toolbar);
    map.addControl(scale);
    const markers = destinations.map((d) => {
      const marker = new window.AMap.Marker({
        position: [d.lng, d.lat],
        title: d.name,
        content: `<button class="amap-marker ${d.id === state.selectedId ? "on" : ""}" aria-label="${esc(d.name)}"></button>`,
        offset: new window.AMap.Pixel(-9, -9),
      });
      marker.on("click", (event) => {
        event?.originEvent?.stopPropagation?.();
        selectMapDestination(d.id);
      });
      map.add(marker);
      return marker;
    });
    map.on("click", (event) => pickMapPlace(event));
    map.on("complete", () => container.closest(".world-map")?.classList.add("map-loaded"));
    state.amap = { instance: map, container, markers, toolbar, scale };
    setTimeout(() => container.closest(".world-map")?.classList.add("map-loaded"), 3200);
  } catch (error) {
    console.warn("Explore map fallback:", error?.message || error);
    container.closest(".world-map")?.classList.add("amap-failed", "map-loaded");
  }
}

function updateAmapStyle() {
  if (state.amap?.instance) {
    state.amap.instance.setMapStyle(amapStyle());
  }
}

function render() {
  const route = state.route;
  // Preserve the .world-map DOM when re-rendering the explore page with an
  // active map instance, so the AMap and its loading state survive across
  // non-route-change re-renders (toast, setLoading, popup close, etc.).
  let savedWorldMap = null;
  if (route === "/" && state.amap?.instance) {
    savedWorldMap = app.querySelector(".world-map");
    if (savedWorldMap) savedWorldMap.remove();
  } else if (state.amap?.instance) {
    cleanupMap();
  }
  app.innerHTML = route === "/" ? explore()
    : route === "/advisor" ? advisorPage()
    : route === "/planner" ? planner()
    : route === "/memories" ? memories()
    : route === "/recommend" ? recommend()
    : route === "/wishlist" ? wishlist()
    : route === "/profile" ? profile()
    : route === "/settings" ? settings()
    : route.startsWith("/memory/") ? memoryDetailPage(route)
    : route.startsWith("/destination/") ? destinationPage(route.split("/").pop())
    : explore();
  // Re-insert the preserved map element so the AMap instance stays alive
  if (savedWorldMap) {
    const hero = app.querySelector(".maphero");
    // Remove the newly-created .world-map that explore() just generated,
    // otherwise the duplicate (with its loading mask at z-index 12) covers
    // the real map we're about to re-insert.
    const freshMap = hero?.querySelector(".world-map");
    if (freshMap) freshMap.remove();
    const anchor = app.querySelector(".hero-copy");
    if (hero && anchor) {
      hero.insertBefore(savedWorldMap, anchor);
    } else {
      // Fallback: if the expected structure isn't found, just insert at start
      hero?.insertBefore(savedWorldMap, hero.firstChild);
    }
    // Keep the container reference in sync so initExploreMap's guard works
    if (state.amap) state.amap.container = savedWorldMap.querySelector("#amapCanvas");
  }
  document.documentElement.dataset.theme = state.theme;
  syncAiScroll();
  ensureRouteData(route);
}

function syncAiScroll(force = false) {
  const apply = () => {
    const list = document.querySelector(".msgs");
    if (!list) return;
    if (force || state.aiStickToBottom) {
      list.scrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
      state.aiScrollTop = list.scrollTop;
      state.aiStickToBottom = true;
      document.querySelector(".scroll-latest")?.classList.remove("show");
      return;
    }
    list.scrollTop = Math.min(state.aiScrollTop, Math.max(0, list.scrollHeight - list.clientHeight));
  };
  apply();
  requestAnimationFrame(apply);
  setTimeout(apply, 80);
}

function ensureRouteData(route) {
  if (route.startsWith("/destination/")) state.selectedId = routeDestination(route).id || state.selectedId;
  if (route === "/" && bootstrap.settingsPublic?.map?.configured) setTimeout(initExploreMap, 0);
  if (["/", "/recommend"].includes(route) && !state.recommendationsLoaded && !state.loading.recommend) setTimeout(loadRecommendations, 0);
  if (route.startsWith("/destination/")) setTimeout(() => loadDestinationDetail(routeDestination(route)), 0);
  if (route.startsWith("/destination/") && state.activeDestinationTab === "图片" && !state.galleryImages.length && !state.loading.gallery) setTimeout(() => loadGallery(destinationMediaQuery(routeDestination(route))), 0);
  if (["/", "/recommend", "/wishlist"].includes(route) || route.startsWith("/destination/") || route.startsWith("/memory/")) setTimeout(() => loadVisibleDestinationMedia(route), 0);
  if (route === "/memories") setTimeout(loadMemoryRecordMedia, 0);
  if (route === "/settings" && !state.integrations) setTimeout(loadIntegrationSettings, 0);
  if (route === "/admin" && state.activeAdmin === "settings" && !state.integrations) setTimeout(loadIntegrationSettings, 0);
}

app.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger || trigger.disabled) return;
  const { action, id, value, route, text } = trigger.dataset;
  if (action === "go") return go(route || "/");
  if (action === "toggleTheme") {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("shiguang-theme", state.theme);
    updateAmapStyle();
    toast(state.theme === "dark" ? "已切换到夜间模式，高德地图同步切换夜间样式。" : "已切换到日间模式，高德地图同步切换日间样式。", "success");
    return;
  }
  if (action === "mapBackground") {
    return pickMapPlaceFromDom(event);
  }
  if (action === "closeMapPopup") {
    return closeMapPopup();
  }
  if (action === "selectDestination") {
    if (state.route === "/") return selectMapDestination(id);
    state.selectedId = id;
    state.mapPopupOpen = true;
    return render();
  }
  if (action === "askPickedPlace") {
    const picked = state.mapPickedPlace;
    if (!picked) return;
    state.advisorDraft = `${picked.name} ${picked.region}`;
    writeJson("shiguang-advisor-draft", state.advisorDraft);
    return go("/advisor");
  }
  if (action === "detailPickedPlace") {
    const picked = state.mapPickedPlace;
    if (!picked || !picked.name || picked.name === "正在识别附近城市…") {
      return toast("正在获取位置信息，请稍后再查看详情。", "warn");
    }
    state.pendingDetailPlace = picked;
    return go(`/destination/map-picked`);
  }
  if (action === "planDestination") {
    state.selectedId = id || state.selectedId;
    state.pendingPlanDestination = selectedDestination().name || "";
    state.mapPopupOpen = true;
    state.planningTransition = true;
    flyToPlanningDestination(selectedDestination());
    if (state.route === "/" && state.amap?.instance) refreshMapPopup();
    else render();
    setTimeout(() => {
      state.planningTransition = false;
      go("/planner");
    }, 1120);
    return;
  }
  if (action === "wish") {
    if (!state.wished.includes(id)) state.wished.push(id);
    writeJson("shiguang-wishlist", state.wished);
    toast("已加入愿望清单。", "success");
    return;
  }
  if (action === "removeWish") {
    state.wished = state.wished.filter((item) => item !== id);
    writeJson("shiguang-wishlist", state.wished);
    toast("已从愿望清单移除。", "success");
    return;
  }
  if (action === "dismiss") {
    if (!state.dismissed.includes(id)) state.dismissed.push(id);
    writeJson("shiguang-dismissed", state.dismissed);
    toast("已降低该目的地推荐权重。", "success");
    return;
  }
  if (action === "sendAi") return sendAi(text);
  if (action === "advisorPlan") return advisorPlan(id);
  if (action === "advisorMemory") return advisorMemory(id);
  if (action === "toggleChatHistory") {
    state.chatHistoryOpen = !state.chatHistoryOpen;
    return render();
  }
  if (action === "toggleChatWorkflow") {
    state.chatWorkflowExpanded = state.chatWorkflowExpanded !== false ? false : true;
    updateChatWorkflowCardDom();
    return;
  }
  if (action === "loadChatSession") {
    const session = state.chatSessions.find((item) => item.id === id);
    if (session) {
      state.currentChatId = session.id;
      state.messages = Array.isArray(session.messages) ? session.messages : [];
      state.chatHistoryOpen = false;
      state.aiStickToBottom = true;
      writeJson("shiguang-ai-current", state.messages);
      render();
      syncAiScroll(true);
    }
    return;
  }
  if (action === "newChatSession") {
    persistChat();
    state.currentChatId = "";
    state.messages = [];
    state.chatHistoryOpen = false;
    state.aiStickToBottom = true;
    writeJson("shiguang-ai-current", state.messages);
    return render();
  }
  if (action === "imageVision") {
    toast("图片识别 API 按钮已预留，后续可接入上传和识别接口。", "info");
    return;
  }
  if (action === "scrollAiBottom") {
    state.aiStickToBottom = true;
    syncAiScroll(true);
    return;
  }
  if (action === "collapseAi") {
    state.aiExpanded = false;
    return render();
  }
  if (action === "togglePlannerTag") {
    state.plannerTags = state.plannerTags.includes(value) ? state.plannerTags.filter((item) => item !== value) : [...state.plannerTags, value];
    return render();
  }
  if (action === "setPreferenceType") {
    state.preferenceType = value || "general";
    return render();
  }
  if (action === "toggleRecommendFilter") {
    state.recommendFilters = state.recommendFilters.includes(value) ? state.recommendFilters.filter((item) => item !== value) : [...state.recommendFilters, value];
    return render();
  }
  if (action === "makePlan") return makePlan();
  if (action === "loadTripPlans") return loadTripPlans();
  if (action === "modalStay") return;
  if (action === "closeTripHistory") {
    state.planHistoryOpen = false;
    return render();
  }
  if (action === "selectTripPlan") {
    const plan = state.planHistory.find((item) => item.id === id);
    if (plan) {
      state.plans = [normalizePlan(plan), ...state.plans.filter((item) => item.id !== plan.id)];
      state.planHistoryOpen = false;
      toast("已载入这次历史规划。", "success");
      return render();
    }
    return;
  }
  if (action === "exportPlan") return exportPlan();
  if (action === "addCalendar") return addCalendar();
  if (action === "loadRecommendations") return loadRecommendations(true);
  if (action === "loadPreferences") return loadPreferences();
  if (action === "addPreference") return addPreference();
  if (action === "setPreference") return setPreference(id, value);
  if (action === "deletePreference") return deletePreference(id);
  if (action === "setDestinationTab") {
    state.activeDestinationTab = value;
    state.galleryImages = [];
    if (value === "图片") {
      const query = destinationMediaQuery(routeDestination());
      loadGallery(query);
    }
    return render();
  }
  if (action === "adminTab") {
    state.activeAdmin = value;
    return render();
  }
  if (action === "loadAdminStats") return loadAdminStats();
  if (action === "loadIntegrationSettings") return loadIntegrationSettings();
  if (action === "saveIntegrationSettings") return saveIntegrationSettings();
  if (action === "adminSetPreference") return adminSetPreference(id, value);
  if (action === "adminDeletePreference") return adminDeletePreference(id);
  if (action === "adminLoadMedia") return adminLoadMedia(id);
  if (action === "adminClearMedia") return adminClearMedia(id);
  if (action === "editUser") {
    state.editingUserId = id;
    return render();
  }
  if (action === "newUser") {
    state.editingUserId = "";
    return render();
  }
  if (action === "saveSettings") return saveIntegrationSettings();
  if (action === "loadSettings") return loadIntegrationSettings();
  if (action === "runApiCheck") return runApiCheck();
  if (action === "toggleTrace") {
    // trace 已迁移到 workflowProgress stepper，不再处理内联追踪
    return;
  }
  if (action === "saveUser") return saveUser();
  if (action === "saveAccount") return saveAccount();
  if (action === "deleteUser") return deleteUser(id);
  if (action === "goAdminSettings") {
    state.activeAdmin = "settings";
    if (!state.integrations) setTimeout(loadIntegrationSettings, 0);
    return go("/admin");
  }
  if (action === "goAdminUsers") {
    state.activeAdmin = "users";
    return go("/admin");
  }
  if (action === "toggleMapImmersive") {
    state.mapImmersive = !state.mapImmersive;
    toast(state.mapImmersive ? "已进入沉浸地图，减少视觉遮挡。" : "已退出沉浸地图。", "success");
    return render();
  }
  if (action === "cycleMapLayer") {
    state.mapLayer = state.mapLayer === "smart" ? "clear" : "smart";
    toast(state.mapLayer === "clear" ? "已切换清晰地图层，背景图不再压住地图。" : "已切回旅行氛围图层。", "success");
    return render();
  }
  if (action === "toggleMapPreference") {
    state.mapPreferenceOnly = !state.mapPreferenceOnly;
    toast(state.mapPreferenceOnly ? "已按画像偏好突出高匹配目的地。" : "已显示全部目的地。", "success");
    return render();
  }
  if (action === "fullscreen") return toast("地图已采用最大化布局，浏览器全屏可用 F11。", "info");
});

let activeMindNode = null;

function updateMindLines(canvas) {
  if (!canvas) return;
  const nodes = Object.fromEntries([...canvas.querySelectorAll("[data-mind-node]")].map((node) => [node.dataset.mindNode, node]));
  canvas.querySelectorAll(".mind-link").forEach((line) => {
    const from = nodes[line.dataset.from];
    const to = nodes[line.dataset.to];
    if (!from || !to) return;
    line.setAttribute("x1", `${from.dataset.x}%`);
    line.setAttribute("y1", `${from.dataset.y}%`);
    line.setAttribute("x2", `${to.dataset.x}%`);
    line.setAttribute("y2", `${to.dataset.y}%`);
  });
}

app.addEventListener("pointerdown", (event) => {
  const node = event.target.closest("[data-mind-node]");
  if (!node) return;
  const canvas = node.closest(".mind-canvas");
  const rect = canvas.getBoundingClientRect();
  activeMindNode = { node, canvas, rect };
  node.classList.add("dragging");
  node.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});

app.addEventListener("pointermove", (event) => {
  if (!activeMindNode) return;
  const { node, canvas, rect } = activeMindNode;
  const x = Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(10, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100));
  node.dataset.x = x.toFixed(2);
  node.dataset.y = y.toFixed(2);
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
  updateMindLines(canvas);
});

app.addEventListener("pointerup", () => {
  if (!activeMindNode) return;
  activeMindNode.node.classList.remove("dragging");
  activeMindNode = null;
});

app.addEventListener("scroll", (event) => {
  const list = event.target;
  if (!(list instanceof HTMLElement) || !list.classList.contains("msgs")) return;
  const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
  state.aiScrollTop = list.scrollTop;
  state.aiStickToBottom = distance < 18;
  document.querySelector(".scroll-latest")?.classList.toggle("show", !state.aiStickToBottom && state.messages.length > 0);
}, true);

app.addEventListener("keydown", (event) => {
  const routeCard = event.target?.closest?.(".memory-photo-card[data-action='go']");
  if (routeCard && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    return go(routeCard.dataset.route || "/memories");
  }
  if (event.key === "Enter" && (event.target?.id === "aiInput" || event.target?.id === "mapAiInput") && !event.shiftKey) {
    event.preventDefault();
    sendAi();
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "aiInput" || target.id === "mapAiInput") {
    state.advisorDraft = target.value;
    const composer = target.closest(".advisor-composer, .airow");
    const btn = composer?.querySelector(".send");
    if (btn) {
      btn.disabled = !target.value.trim() || state.loading.ai;
    }
  }
});

addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "/login";
  render();
});

render();
