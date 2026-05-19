"use strict";

const STORAGE_KEY = "senior-simple-tasks:v2";
const LEGACY_STORAGE_KEY = "senior-simple-tasks:v1";
const SETTINGS_KEY = "senior-simple-tasks:settings";
const FAMILY_LOG_KEY = "senior-simple-tasks:family-log";
const FAMILY_INVITE_KEY = "senior-simple-tasks:family-invite";
const DUMMY_SEED_KEY = "senior-simple-tasks:dummy-seed";
const DUMMY_SEED_VERSION = "20260519-more-dummy-tasks-v2";
const DEFAULT_PROFILE_PHOTO = "./assets/avatar-default.png";

const timeLabels = {
  none: "指定なし",
  morning: "朝",
  noon: "昼",
  evening: "夕方",
  night: "夜",
};

const timeOrder = {
  morning: 1,
  noon: 2,
  evening: 3,
  night: 4,
  none: 5,
};

const categoryLabels = {
  medicine: "服薬",
  hospital: "通院",
  exercise: "運動",
  life: "生活",
};

const categoryOrder = {
  medicine: 1,
  hospital: 2,
  exercise: 3,
  life: 4,
};

const state = {
  tasks: loadTasks(),
  familyLogs: loadFamilyLogs(),
  familyInvite: loadFamilyInvite(),
  selectedDateKey: toLocalDateKey(new Date()),
  view: "main",
  addReturnView: "main",
  pendingMedicineTaskId: null,
  pendingAddSlot: "morning",
  lastDeleted: null,
  speechToken: 0,
  settings: loadSettings(),
};

const elements = {
  body: document.body,
  topAdvicePanel: document.querySelector(".top-advice-panel"),
  whiteboardSection: document.querySelector(".whiteboard-section"),
  mainScreen: document.querySelector("#mainScreen"),
  dayScreen: document.querySelector("#dayScreen"),
  workspace: document.querySelector("#workspace"),
  loginScreen: document.querySelector("#loginScreen"),
  settingsScreen: document.querySelector("#settingsScreen"),
  viewTargetButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  hamburgerButton: document.querySelector("#hamburgerButton"),
  profileMenuPhoto: document.querySelector("#profileMenuPhoto"),
  profileMenuInitial: document.querySelector("#profileMenuInitial"),
  appMenu: document.querySelector("#appMenu"),
  menuCloseButton: document.querySelector("#menuCloseButton"),
  loginForm: document.querySelector("#loginForm"),
  loginName: document.querySelector("#loginName"),
  loginCode: document.querySelector("#loginCode"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsUserName: document.querySelector("#settingsUserName"),
  settingsFamilyName: document.querySelector("#settingsFamilyName"),
  settingsDefaultTime: document.querySelector("#settingsDefaultTime"),
  settingsPhoto: document.querySelector("#settingsPhoto"),
  settingsPhotoPreview: document.querySelector("#settingsPhotoPreview"),
  settingsLargeText: document.querySelector("#settingsLargeText"),
  form: document.querySelector("#taskForm"),
  title: document.querySelector("#taskTitle"),
  category: document.querySelector("#taskCategory"),
  note: document.querySelector("#taskNote"),
  date: document.querySelector("#taskDate"),
  timeSlot: document.querySelector("#timeSlot"),
  reminderTime: document.querySelector("#reminderTime"),
  voiceStatus: document.querySelector("#voiceStatus"),
  readabilityButton: document.querySelector("#readabilityButton"),
  voiceGuideToggle: document.querySelector("#voiceGuideToggle"),
  voiceGuideState: document.querySelector("#voiceGuideState"),
  selectedDayTitle: document.querySelector("#selectedDayTitle"),
  selectedTaskList: document.querySelector("#selectedTaskList"),
  selectedAddButton: document.querySelector("#selectedAddButton"),
  backToCalendarButton: document.querySelector("#backToCalendarButton"),
  backFromAddButton: document.querySelector("#backFromAddButton"),
  toast: document.querySelector("#toast"),
  whiteboardSummaryDate: document.querySelector("#whiteboardSummaryDate"),
  dashboardDate: document.querySelector("#dashboardDate"),
  summaryCards: document.querySelector("#summaryCards"),
  dashboardProgressText: document.querySelector("#dashboardProgressText"),
  dashboardProgressBar: document.querySelector("#dashboardProgressBar"),
  dashboardTaskList: document.querySelector("#dashboardTaskList"),
  watchStatusBadge: document.querySelector("#watchStatusBadge"),
  watchStatusText: document.querySelector("#watchStatusText"),
  watchAnalytics: document.querySelector("#watchAnalytics"),
  conditionStatus: document.querySelector("#conditionStatus"),
  conditionButtons: Array.from(document.querySelectorAll("[data-condition]")),
  emergencyButton: document.querySelector("#emergencyButton"),
  familyInviteStatus: document.querySelector("#familyInviteStatus"),
  inviteFamilyButton: document.querySelector("#inviteFamilyButton"),
  familyInviteModal: document.querySelector("#familyInviteModal"),
  familyInviteLink: document.querySelector("#familyInviteLink"),
  inviteQr: document.querySelector("#inviteQr"),
  copyInviteLinkButton: document.querySelector("#copyInviteLinkButton"),
  familyInviteCloseButton: document.querySelector("#familyInviteCloseButton"),
  voiceQuestionModal: document.querySelector("#voiceQuestionModal"),
  voiceQuestionCloseButton: document.querySelector("#voiceQuestionCloseButton"),
  voiceConditionButtons: Array.from(document.querySelectorAll("[data-voice-condition]")),
  weekStatus: document.querySelector("#weekStatus"),
  adviceText: document.querySelector("#adviceText"),
  familyLogList: document.querySelector("#familyLogList"),
  markerConfirm: document.querySelector("#markerConfirm"),
  markerConfirmTitle: document.querySelector("#markerConfirmTitle"),
  markerConfirmDetail: document.querySelector("#markerConfirmDetail"),
  markerConfirmButton: document.querySelector("#markerConfirmButton"),
  markerCancelButton: document.querySelector("#markerCancelButton"),
  markerAddConfirm: document.querySelector("#markerAddConfirm"),
  markerAddCancelButton: document.querySelector("#markerAddCancelButton"),
  timeChoiceButtons: Array.from(document.querySelectorAll("[data-add-slot]")),
  quickButtons: Array.from(document.querySelectorAll("[data-template]")),
};

initialise();

function initialise() {
  elements.date.value = toLocalDateKey(new Date());
  elements.body.classList.toggle("large-text", state.settings.largeText);
  updateReadabilityButton();
  updateVoiceGuideButton();
  syncSettingsFields();
  updateProfilePhoto();
  bindEvents();
  render();
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTaskFromForm();
  });

  elements.readabilityButton.addEventListener("click", () => {
    state.settings.largeText = !state.settings.largeText;
    saveSettings();
    elements.body.classList.toggle("large-text", state.settings.largeText);
    updateReadabilityButton();
  });

  elements.voiceGuideToggle.addEventListener("change", () => {
    setVoiceGuideEnabled(elements.voiceGuideToggle.checked);
    if (state.settings.voiceGuide) {
      openVoiceQuestionnaire();
      speakAdvice();
    } else {
      stopSpeech();
    }
  });

  elements.viewTargetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeMenu();
      openView(button.dataset.viewTarget);
    });
  });

  elements.hamburgerButton.addEventListener("click", openMenu);
  elements.menuCloseButton.addEventListener("click", closeMenu);
  elements.appMenu.addEventListener("click", (event) => {
    if (event.target === elements.appMenu) closeMenu();
  });

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveLogin();
  });

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAppSettings();
  });

  elements.settingsLargeText.addEventListener("change", () => {
    state.settings.largeText = elements.settingsLargeText.checked;
    saveSettings();
    elements.body.classList.toggle("large-text", state.settings.largeText);
    updateReadabilityButton();
  });

  elements.settingsPhoto.addEventListener("change", handlePhotoUpload);

  elements.selectedAddButton.addEventListener("click", () => {
    openAddScreen("day");
  });

  elements.backToCalendarButton.addEventListener("click", () => {
    state.view = "main";
    render();
  });

  elements.backFromAddButton.addEventListener("click", () => {
    state.view = state.addReturnView || "main";
    render();
  });

  elements.date.addEventListener("change", () => {
    if (!elements.date.value) return;
    state.selectedDateKey = elements.date.value;
    render();
  });

  elements.weekStatus.addEventListener("click", (event) => {
    const button = event.target.closest("[data-week-date-key]");
    if (!button) return;
    state.selectedDateKey = button.dataset.weekDateKey;
    elements.date.value = state.selectedDateKey;
    state.view = "main";
    render();
  });

  elements.category.addEventListener("change", () => {
    if (elements.category.value === "medicine" && !elements.reminderTime.value) {
      elements.reminderTime.value = defaultReminderTime(elements.timeSlot.value);
    }
  });

  elements.timeSlot.addEventListener("change", () => {
    if (elements.category.value === "medicine" && !elements.reminderTime.value) {
      elements.reminderTime.value = defaultReminderTime(elements.timeSlot.value);
    }
  });

  elements.quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.title.value = button.dataset.template;
      elements.category.value = button.dataset.category || "medicine";
      if (elements.category.value === "medicine" && !elements.reminderTime.value) {
        elements.reminderTime.value = defaultReminderTime(elements.timeSlot.value);
      }
      elements.title.focus();
    });
  });

  elements.dashboardTaskList.addEventListener("click", handleCalendarAction);
  elements.selectedTaskList.addEventListener("click", handleCalendarAction);
  elements.conditionButtons.forEach((button) => {
    button.addEventListener("click", () => recordCondition(button.dataset.condition));
  });
  elements.emergencyButton.addEventListener("click", sendEmergencyContact);
  elements.inviteFamilyButton.addEventListener("click", openFamilyInviteModal);
  elements.copyInviteLinkButton.addEventListener("click", copyInviteLink);
  elements.familyInviteCloseButton.addEventListener("click", closeFamilyInviteModal);
  elements.familyInviteModal.addEventListener("click", (event) => {
    if (event.target === elements.familyInviteModal) closeFamilyInviteModal();
  });
  elements.voiceConditionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      recordCondition(button.dataset.voiceCondition, "voice");
      closeVoiceQuestionnaire();
    });
  });
  elements.voiceQuestionCloseButton.addEventListener("click", closeVoiceQuestionnaire);
  elements.voiceQuestionModal.addEventListener("click", (event) => {
    if (event.target === elements.voiceQuestionModal) closeVoiceQuestionnaire();
  });
  elements.markerConfirmButton.addEventListener("click", confirmMedicineMarker);
  elements.markerCancelButton.addEventListener("click", closeMedicineConfirm);
  elements.markerConfirm.addEventListener("click", (event) => {
    if (event.target === elements.markerConfirm) closeMedicineConfirm();
  });
  elements.timeChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      addMedicineMarker(button.dataset.addSlot);
    });
  });
  elements.markerAddCancelButton.addEventListener("click", closeMarkerAddConfirm);
  elements.markerAddConfirm.addEventListener("click", (event) => {
    if (event.target === elements.markerAddConfirm) closeMarkerAddConfirm();
  });
  elements.toast.addEventListener("click", handleToastAction);
}

function addTaskFromForm() {
  const title = elements.title.value.trim();

  if (!title) {
    setStatus("やることを入力してください。", "is-error");
    elements.title.focus();
    return;
  }

  if (!elements.date.value) {
    setStatus("日付を選んでください。", "is-error");
    elements.date.focus();
    return;
  }

  const task = {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : String(Date.now()),
    title,
    category: getCategory(elements.category.value),
    note: elements.note.value.trim(),
    dateKey: elements.date.value,
    timeSlot: elements.timeSlot.value,
    reminderTime: elements.reminderTime.value,
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  state.tasks.unshift(task);
  state.selectedDateKey = task.dateKey;
  state.view = "day";
  state.addReturnView = "day";
  saveTasks();
  elements.form.reset();
  elements.date.value = task.dateKey;
  elements.category.value = "medicine";
  elements.reminderTime.value = "";
  setStatus("タスクを追加しました。", "is-success");
  showToast("タスクを追加しました。");
  render();
}

function openAddScreen(returnView) {
  state.addReturnView = returnView;
  state.view = "add";
  elements.date.value = state.selectedDateKey;
  if (elements.category.value === "medicine" && !elements.reminderTime.value) {
    elements.reminderTime.value = defaultReminderTime(elements.timeSlot.value);
  }
  setStatus(`${formatShortDate(state.selectedDateKey)}に追加します。`, "is-success");
  render();
  elements.title.focus();
}

function openView(view) {
  if (view === "add") {
    openAddScreen("main");
    return;
  }

  state.view = view || "main";
  render();

  if (state.view === "login") {
    elements.loginName.focus();
  }

  if (state.view === "settings") {
    syncSettingsFields();
    elements.settingsUserName.focus();
  }
}

function openMenu() {
  elements.appMenu.hidden = false;
  elements.hamburgerButton.setAttribute("aria-expanded", "true");
  elements.menuCloseButton.focus();
}

function closeMenu() {
  elements.appMenu.hidden = true;
  elements.hamburgerButton.setAttribute("aria-expanded", "false");
}

function handleCalendarAction(event) {
  const addButton = event.target.closest("button[data-date-key]");
  if (addButton) {
    state.selectedDateKey = addButton.dataset.dateKey;
    elements.date.value = state.selectedDateKey;
    state.view = "main";
    render();
    return;
  }

  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const id = actionButton.closest("[data-task-id]")?.dataset.taskId;
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  const action = actionButton.dataset.action;

  if (action === "toggle") {
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    if (task.done && getCategory(task.category) === "medicine") {
      addFamilyLog("服薬完了を家族に共有しました。", task);
    }
    saveTasks();
    showToast(task.done ? "完了にしました。" : "未完了に戻しました。");
    render();
  }

  if (action === "next-day") {
    task.dateKey = shiftDateKey(task.dateKey, 1);
    task.done = false;
    task.completedAt = null;
    saveTasks();
    showToast("次の日に移しました。");
    render();
  }

  if (action === "delete") {
    state.lastDeleted = { ...task };
    state.tasks = state.tasks.filter((item) => item.id !== id);
    saveTasks();
    showToast("削除しました。", "元に戻す");
    render();
  }

}

function handleMarkerAction(event) {
  const marker = event.target.closest("[data-marker-category]");
  if (!marker) {
    const slot = event.target.closest("[data-whiteboard-slot]");
    if (slot) openMarkerAddConfirm(slot.dataset.whiteboardSlot);
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (marker.dataset.markerTaskId) {
    openMedicineConfirm(marker.dataset.markerTaskId);
    return;
  }

  const category = getCategory(marker.dataset.markerCategory);
  if (category !== "medicine") {
    state.selectedDateKey = marker.dataset.markerDateKey || state.selectedDateKey;
    elements.date.value = state.selectedDateKey;
    state.view = "day";
    render();
    return;
  }

  openMedicineConfirmForCategory(marker.dataset.markerDateKey || state.selectedDateKey, category);
}

function openMarkerAddConfirm(slot) {
  state.pendingAddSlot = getAddSlot(slot);
  elements.markerAddConfirm.hidden = false;
  const selectedButton = elements.timeChoiceButtons.find((button) => button.dataset.addSlot === state.pendingAddSlot);
  selectedButton?.focus();
}

function closeMarkerAddConfirm() {
  elements.markerAddConfirm.hidden = true;
}

function addMedicineMarker(slot) {
  const timeSlot = getAddSlot(slot);
  const task = {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : String(Date.now()),
    title: "薬を飲む",
    category: "medicine",
    note: "",
    dateKey: state.selectedDateKey,
    timeSlot,
    reminderTime: defaultReminderTime(timeSlot),
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  state.tasks.unshift(task);
  elements.date.value = task.dateKey;
  closeMarkerAddConfirm();
  saveTasks();
  showToast(`${timeLabels[timeSlot]}に服薬マーカーを追加しました。`);
  render();
}

function openMedicineConfirm(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (getCategory(task.category) !== "medicine") {
    state.selectedDateKey = task.dateKey;
    elements.date.value = state.selectedDateKey;
    state.view = "day";
    render();
    return;
  }

  state.pendingMedicineTaskId = task.id;
  elements.markerConfirmTitle.textContent = task.done
    ? "まだへ戻しますか？"
    : "完了へ移動しますか？";
  elements.markerConfirmDetail.textContent = task.done
    ? `${formatShortDate(task.dateKey)} ${task.title}を未完了側へ戻します。`
    : `${formatShortDate(task.dateKey)} ${task.title}を完了側へ移します。`;
  elements.markerConfirmButton.textContent = task.done ? "まだへ戻す" : "完了へ移動";
  elements.markerCancelButton.textContent = "取り消す";
  elements.markerConfirm.hidden = false;
  elements.markerConfirmButton.focus();
}

function openMedicineConfirmForCategory(dateKey, category) {
  const markerTasks = getTasksForDate(dateKey).filter((task) => getCategory(task.category) === category);
  const activeTask = markerTasks.find((task) => !task.done);
  const doneTask = markerTasks.find((task) => task.done);
  const task = activeTask || doneTask;
  if (task) openMedicineConfirm(task.id);
}

function confirmMedicineMarker() {
  const task = state.tasks.find((item) => item.id === state.pendingMedicineTaskId);
  if (!task) {
    closeMedicineConfirm();
    return;
  }

  if (task.done) {
    task.done = false;
    task.completedAt = null;
    saveTasks();
    closeMedicineConfirm();
    showToast("マーカーをまだ側へ戻しました。");
    render();
    return;
  }

  task.done = true;
  task.completedAt = new Date().toISOString();
  addFamilyLog("服薬完了を家族に共有しました。", task);
  saveTasks();
  closeMedicineConfirm();
  showToast("マーカーを完了へ移動しました。");
  render();
}

function closeMedicineConfirm() {
  state.pendingMedicineTaskId = null;
  elements.markerConfirm.hidden = true;
}

function handleToastAction(event) {
  const button = event.target.closest("button[data-toast-action]");
  if (!button || button.dataset.toastAction !== "undo-delete") return;
  if (!state.lastDeleted) return;

  const exists = state.tasks.some((task) => task.id === state.lastDeleted.id);
  if (!exists) {
    state.tasks.unshift(state.lastDeleted);
    saveTasks();
  }

  state.lastDeleted = null;
  elements.toast.hidden = true;
  showToast("削除を取り消しました。");
  render();
}

function render() {
  updateView();
  renderWhiteboard();
  renderDashboard();
  renderFamilyLog();
  renderSelectedDay();
}

function updateView() {
  const isDayView = state.view === "day";
  const isAddView = state.view === "add";
  const isLoginView = state.view === "login";
  const isSettingsView = state.view === "settings";
  const isMainView = !isDayView && !isAddView && !isLoginView && !isSettingsView;
  elements.topAdvicePanel.hidden = !isMainView;
  elements.whiteboardSection.hidden = !isMainView;
  elements.mainScreen.hidden = !isMainView;
  elements.dayScreen.hidden = !isDayView;
  elements.workspace.hidden = !isAddView;
  elements.loginScreen.hidden = !isLoginView;
  elements.settingsScreen.hidden = !isSettingsView;
}

function renderWhiteboard() {
  const date = new Date(`${state.selectedDateKey}T00:00:00`);
  const tasks = getTasksForDate(state.selectedDateKey);
  const activeTasks = tasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);
  const medicineTasks = tasks.filter((task) => getCategory(task.category) === "medicine");
  const activeMedicine = medicineTasks.filter((task) => !task.done);
  const progress = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  elements.whiteboardSummaryDate.textContent = formatSelectedDate(date);
  elements.summaryCards.innerHTML = summaryCardsMarkup({
    total: tasks.length,
    done: doneTasks.length,
    active: activeTasks.length,
    activeMedicine: activeMedicine.length,
  });
  elements.dashboardProgressText.textContent = `${progress}%`;
  elements.dashboardProgressBar.style.width = `${progress}%`;
}

function renderDashboard() {
  const date = new Date(`${state.selectedDateKey}T00:00:00`);
  const tasks = getTasksForDate(state.selectedDateKey);
  const medicineTasks = tasks.filter((task) => getCategory(task.category) === "medicine");
  const activeMedicine = medicineTasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);
  const progress = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const latestCondition = getLatestConditionForDate(state.selectedDateKey);
  const latestLog = getLatestFamilyLogForDate(state.selectedDateKey);

  if (elements.dashboardDate) {
    elements.dashboardDate.textContent = formatSelectedDate(date);
  }
  elements.dashboardTaskList.innerHTML = tasks.length
    ? tasks.map(taskMarkup).join("")
    : `
      <div class="selected-empty">
        <strong>この日のやることはありません</strong>
        <p>白板の＋マーカーから服薬予定を追加できます。</p>
      </div>
    `;

  elements.watchStatusBadge.textContent = watchStatusBadge(activeMedicine, latestCondition);
  elements.watchStatusText.textContent = watchStatusText(activeMedicine, latestCondition, progress);
  elements.watchAnalytics.innerHTML = watchAnalyticsMarkup({
    progress,
    activeMedicineCount: activeMedicine.length,
    latestCondition,
    latestLog,
  });
  elements.conditionStatus.textContent = latestCondition ? "記録済み" : "未記録";
  elements.familyInviteStatus.textContent = state.familyInvite.linked
    ? "連携済み：家族へLINE通知を送れます。"
    : "未連携：QRコードで家族を招待できます。";
  elements.weekStatus.innerHTML = weekStatusMarkup(date);
  elements.adviceText.textContent = adviceTextForTasks(tasks, activeMedicine, date);
}

function summaryCardsMarkup({ total, done }) {
  const cards = [
    { label: "やること", value: total, tone: "life" },
    { label: "完了", value: done, tone: "exercise" },
  ];

  return cards.map((card) => `
    <article class="summary-card category-${card.tone}">
      <strong>${card.value}</strong>
      <span>${card.label}</span>
    </article>
  `).join("");
}

function weekStatusMarkup(date) {
  return getWeekDates(date).map((day) => {
    const dateKey = toLocalDateKey(day);
    const tasks = getTasksForDate(dateKey);
    const completed = tasks.length > 0 && tasks.every((task) => task.done);
    const today = dateKey === toLocalDateKey(new Date());
    const selected = dateKey === state.selectedDateKey;
    return `
      <button
        type="button"
        class="${completed ? "is-complete" : ""} ${today ? "is-today" : ""} ${selected ? "is-selected" : ""}"
        data-week-date-key="${escapeHtml(dateKey)}"
        aria-current="${selected ? "date" : "false"}"
      >
        <small>${new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(day)}</small>
        <b>${day.getDate()}</b>
      </button>
    `;
  }).join("");
}

function watchStatusBadge(activeMedicine, latestCondition) {
  if (latestCondition?.condition === "気になる") return "家族共有済み";
  if (activeMedicine.length) return "服薬確認";
  if (latestCondition) return "記録済み";
  return "順調";
}

function watchStatusText(activeMedicine, latestCondition, progress) {
  if (latestCondition?.condition === "気になる") {
    return "気になる記録があります。家族への共有ログを確認できます。";
  }

  if (activeMedicine.length) {
    return `未完了の服薬が${activeMedicine.length}件あります。声かけの目安にできます。`;
  }

  if (progress === 100) return "今日の予定は完了しています。";
  return "今日の記録をもとに状況を確認できます。";
}

function watchAnalyticsMarkup({ progress, activeMedicineCount, latestCondition, latestLog }) {
  const conditionLabel = latestCondition ? latestCondition.condition : "未記録";
  const latestLogTime = latestLog ? formatLogTime(latestLog.createdAt) : "なし";
  const items = [
    { label: "完了率", value: `${progress}%` },
    { label: "未完了の服薬", value: `${activeMedicineCount}件` },
    { label: "今日の様子", value: conditionLabel },
    { label: "最終通知", value: latestLogTime },
  ];

  return items.map((item) => `
    <article class="watch-analytics-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");
}

function getLatestFamilyLogForDate(dateKey) {
  return state.familyLogs.find((item) => {
    const logDateKey = item.dateKey || toLocalDateKey(new Date(item.createdAt));
    return logDateKey === dateKey;
  }) || null;
}

function adviceTextForTasks(tasks, activeMedicine, date) {
  const seasonalAdvice = seasonalAdviceForDate(date);
  if (activeMedicine.length) return `${seasonalAdvice}服薬マーカーも一緒に確認しましょう。`;
  if (!tasks.length) return `${seasonalAdvice}今日の予定は少なめです。必要な確認だけしておきましょう。`;
  if (tasks.every((task) => task.done)) return `${seasonalAdvice}今日の予定は確認済みです。`;
  return `${seasonalAdvice}残っている予定をひとつずつ確認しましょう。`;
}

function seasonalAdviceForDate(date) {
  const month = date.getMonth() + 1;
  if ([3, 4, 5].includes(month)) return "季節の変わり目です。外出前に予定と持ち物を確認しましょう。";
  if ([6, 7, 8].includes(month)) return "暑い時期です。水分を近くに置いて、予定をゆっくり確認しましょう。";
  if ([9, 10, 11].includes(month)) return "朝晩の気温差が出やすい時期です。服装と予定を確認しましょう。";
  return "冷えやすい時期です。あたたかくして、予定をゆっくり確認しましょう。";
}

function recordCondition(condition, source = "manual") {
  const normalizedCondition = normalizeCondition(condition);
  const date = new Date(`${state.selectedDateKey}T00:00:00`);
  const task = {
    id: `condition-${Date.now()}`,
    title: `今日の様子: ${normalizedCondition}`,
    dateKey: state.selectedDateKey,
  };
  const sourceText = source === "voice" ? "問診で" : "";
  addFamilyLog(`${formatSelectedDate(date)}の様子「${normalizedCondition}」を${sourceText}家族に共有しました。`, task);
  showToast(`今日の様子「${normalizedCondition}」を記録しました。`);
  render();
}

function getLatestConditionForDate(dateKey) {
  const log = state.familyLogs.find((item) => {
    const condition = conditionFromLog(item);
    const logDateKey = item.dateKey || toLocalDateKey(new Date(item.createdAt));
    return condition && logDateKey === dateKey;
  });

  if (!log) return null;
  return {
    condition: conditionFromLog(log),
    createdAt: log.createdAt,
  };
}

function conditionFromLog(log) {
  const match = log.title?.match(/^(?:体調|今日の様子): (良い|普通|悪い|元気|いつも通り|気になる)$/);
  return match ? normalizeCondition(match[1]) : null;
}

function normalizeCondition(condition) {
  const aliases = {
    良い: "元気",
    普通: "いつも通り",
    悪い: "気になる",
  };
  return aliases[condition] || condition;
}

async function sendEmergencyContact() {
  const task = {
    id: `emergency-${Date.now()}`,
    title: "緊急連絡",
  };
  elements.emergencyButton.disabled = true;
  elements.emergencyButton.textContent = "現在地を確認中";

  try {
    const position = await getCurrentPosition();
    const location = locationFromPosition(position);
    addFamilyLog("緊急連絡と現在地を家族に共有しました。", task, { location });
    showToast("現在地付きで緊急連絡ログを残しました。");
  } catch {
    addFamilyLog("緊急連絡を家族に共有しました。位置情報は取得できませんでした。", task);
    showToast("位置情報なしで緊急連絡ログを残しました。");
  } finally {
    elements.emergencyButton.disabled = false;
    elements.emergencyButton.textContent = "緊急連絡";
  }

  render();
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("geolocation unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

function locationFromPosition(position) {
  const latitude = Number(position.coords.latitude.toFixed(6));
  const longitude = Number(position.coords.longitude.toFixed(6));
  return {
    latitude,
    longitude,
    accuracy: Math.round(position.coords.accuracy || 0),
    url: `https://www.google.com/maps?q=${latitude},${longitude}`,
  };
}

function openFamilyInviteModal() {
  const inviteUrl = getFamilyInviteUrl();
  elements.familyInviteLink.value = inviteUrl;
  elements.inviteQr.innerHTML = inviteQrMarkup(inviteUrl);
  elements.familyInviteModal.hidden = false;
  elements.copyInviteLinkButton.focus();
}

function closeFamilyInviteModal() {
  elements.familyInviteModal.hidden = true;
}

function openVoiceQuestionnaire() {
  elements.voiceQuestionModal.hidden = false;
  elements.voiceConditionButtons[0]?.focus();
}

function closeVoiceQuestionnaire() {
  elements.voiceQuestionModal.hidden = true;
}

async function copyInviteLink() {
  const value = elements.familyInviteLink.value;

  try {
    await navigator.clipboard.writeText(value);
    showToast("招待リンクをコピーしました。");
  } catch {
    elements.familyInviteLink.select();
    showToast("招待リンクを選択しました。");
  }
}

function getFamilyInviteUrl() {
  const baseUrl = `${location.origin}${location.pathname}`;
  return `${baseUrl}?invite=${encodeURIComponent(state.familyInvite.id)}`;
}

function inviteQrMarkup(value) {
  const size = 13;
  const cells = Array.from({ length: size * size }, (_, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    const finder = isFinderCell(x, y, 0, 0) || isFinderCell(x, y, 8, 0) || isFinderCell(x, y, 0, 8);
    const hash = value.charCodeAt(index % value.length) + x * 17 + y * 31;
    const dark = finder || hash % 4 === 0 || hash % 7 === 0;
    return `<span class="${dark ? "is-dark" : ""}"></span>`;
  }).join("");

  return `<div class="invite-qr-grid" aria-hidden="true">${cells}</div><small>招待ID ${escapeHtml(state.familyInvite.id)}</small>`;
}

function isFinderCell(x, y, startX, startY) {
  const localX = x - startX;
  const localY = y - startY;
  if (localX < 0 || localY < 0 || localX > 4 || localY > 4) return false;
  return localX === 0 || localX === 4 || localY === 0 || localY === 4 || (localX === 2 && localY === 2);
}

function renderFamilyLog() {
  const logs = state.familyLogs.slice(0, 5);

  if (!logs.length) {
    elements.familyLogList.innerHTML = `
      <div class="family-log-empty">
        <strong>まだ通知はありません</strong>
        <p>服薬完了や今日の様子の共有がここに残ります。</p>
      </div>
    `;
    return;
  }

  elements.familyLogList.innerHTML = logs.map(familyLogMarkup).join("");
}

function renderSelectedDay() {
  const tasks = getTasksForDate(state.selectedDateKey);
  const activeCount = tasks.filter((task) => !task.done).length;
  const date = new Date(`${state.selectedDateKey}T00:00:00`);
  elements.selectedDayTitle.textContent = `${formatSelectedDate(date)}のタスク`;

  if (!tasks.length) {
    elements.selectedTaskList.innerHTML = `
      <div class="selected-empty">
        <strong>この日のタスクはありません</strong>
        <p>「この日に追加」から予定を入れられます。</p>
      </div>
    `;
    return;
  }

  elements.selectedTaskList.innerHTML = `
    <p class="selected-count">未完了 ${activeCount}件 / 全部 ${tasks.length}件</p>
    ${tasks.map(taskMarkup).join("")}
  `;
}

function getTasksForDate(dateKey) {
  return state.tasks
    .filter((task) => task.dateKey === dateKey)
    .sort(sortTasks);
}

function taskMarkup(task) {
  const doneLabel = task.done ? "戻す" : "完了";
  const category = getCategory(task.category);
  const timeBand = taskTimeBand(task.timeSlot);

  return `
    <article class="task-card category-${category} ${task.done ? "is-done" : ""}" data-task-id="${escapeHtml(task.id)}">
      <button class="complete-button" type="button" data-action="toggle" aria-label="${escapeHtml(task.title)}を${doneLabel}">
        <span aria-hidden="true">${task.done ? "✓" : ""}</span>
      </button>
      <div class="task-body">
        <div class="task-line">
          <h3>${escapeHtml(task.title)}</h3>
          <div class="task-meta">
            <span class="task-category category-${category}">${escapeHtml(categoryLabels[category])}</span>
            <span class="time-badge">${escapeHtml(timeLabels[task.timeSlot] || timeLabels.none)}</span>
            ${task.reminderTime ? `<span class="voice-badge">${escapeHtml(task.reminderTime)}</span>` : ""}
          </div>
        </div>
        ${task.note ? `<p>${escapeHtml(task.note)}</p>` : ""}
        <div class="task-actions">
          <button type="button" data-action="next-day">翌日へ</button>
          <button class="danger" type="button" data-action="delete">削除</button>
        </div>
      </div>
      <button class="trash-button" type="button" data-action="delete" aria-label="${escapeHtml(task.title)}を削除">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h10l-.7 11H7.7L7 9Z" />
        </svg>
      </button>
      <span class="task-time-band time-${timeBand.key}">${escapeHtml(timeBand.label)}</span>
    </article>
  `;
}

function taskTimeBand(timeSlot) {
  if (timeSlot === "noon") return { key: "noon", label: "昼" };
  if (timeSlot === "evening" || timeSlot === "night") return { key: "night", label: "夜" };
  if (timeSlot === "morning") return { key: "morning", label: "朝" };
  return { key: "none", label: "未定" };
}

function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if ((timeOrder[a.timeSlot] || 9) !== (timeOrder[b.timeSlot] || 9)) {
    return (timeOrder[a.timeSlot] || 9) - (timeOrder[b.timeSlot] || 9);
  }
  if (getCategory(a.category) !== getCategory(b.category)) {
    return categoryOrder[getCategory(a.category)] - categoryOrder[getCategory(b.category)];
  }
  return a.title.localeCompare(b.title, "ja");
}

function whiteboardMarkerMarkup(marker, dateKey) {
  const category = getCategory(marker.category);
  const isChecked = marker.activeCount === 0 && marker.doneCount > 0;
  const label = `${categoryLabels[category]}${marker.count}件${isChecked ? " 完了済み" : ""}`;
  return `
    <span
      class="whiteboard-marker category-${category} ${isChecked ? "is-checked" : ""}"
      role="button"
      tabindex="0"
      data-marker-category="${category}"
      data-marker-date-key="${escapeHtml(dateKey)}"
      aria-label="${escapeHtml(label)}"
    >
      <span class="whiteboard-dot" aria-hidden="true"></span>
      <span>${escapeHtml(categoryLabels[category])}</span>
      <strong>${marker.count}</strong>
    </span>
  `;
}

function whiteboardSlotsMarkup(tasks) {
  const slots = [
    { key: "morning", label: "朝" },
    { key: "noon", label: "昼" },
    { key: "night", label: "夜" },
  ];

  return slots.map((slot) => {
    const slotTasks = tasks.filter((task) => getWhiteboardSlot(task.timeSlot) === slot.key);
    const activeMarkers = slotTasks.filter((task) => !task.done).map(whiteboardTaskMarkerMarkup).join("");
    const doneMarkers = slotTasks.filter((task) => task.done).map(whiteboardTaskMarkerMarkup).join("");

    return `
      <section class="whiteboard-slot" data-whiteboard-slot="${slot.key}" aria-label="${slot.label}の服薬マーカー">
        <h3>${slot.label}</h3>
        <div class="whiteboard-slot-board">
          <div class="whiteboard-slot-column is-active">
            <span class="slot-column-label">まだ</span>
            <div class="whiteboard-slot-markers">
              ${activeMarkers}
              <button class="whiteboard-add-marker" type="button" data-whiteboard-slot="${slot.key}" aria-label="${slot.label}に服薬マーカーを追加">
                <span aria-hidden="true">＋</span>
                <small>追加</small>
              </button>
            </div>
          </div>
          <div class="whiteboard-slot-column is-done">
            <span class="slot-column-label">完了</span>
            <div class="whiteboard-slot-markers">
              ${doneMarkers || `<span class="whiteboard-slot-empty">なし</span>`}
            </div>
          </div>
        </div>
      </section>
    `;
  }).join("");
}

function whiteboardTaskMarkerMarkup(task) {
  const category = getCategory(task.category);
  const isChecked = task.done;
  const label = `${timeLabels[task.timeSlot] || "指定なし"} ${categoryLabels[category]} ${task.title}${isChecked ? " 完了済み" : ""}`;

  return `
    <span
      class="whiteboard-marker category-${category} ${isChecked ? "is-checked" : ""}"
      role="button"
      tabindex="0"
      data-marker-category="${category}"
      data-marker-task-id="${escapeHtml(task.id)}"
      data-marker-date-key="${escapeHtml(task.dateKey)}"
      aria-label="${escapeHtml(label)}"
    >
      <span class="whiteboard-dot" aria-hidden="true"></span>
      <span>${escapeHtml(categoryLabels[category])}</span>
      ${task.reminderTime ? `<small>${escapeHtml(task.reminderTime)}</small>` : ""}
    </span>
  `;
}

function familyLogMarkup(log) {
  return `
    <article class="family-log-item">
      <span class="family-log-dot category-medicine" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(formatFamilyLogMessage(log.message))}</strong>
        <p>${escapeHtml(formatFamilyLogTitle(log))} / ${escapeHtml(formatLogTime(log.createdAt))}</p>
        ${log.locationUrl ? `<a class="family-log-location" href="${escapeHtml(log.locationUrl)}" target="_blank" rel="noopener">現在地を地図で見る</a>` : ""}
      </div>
    </article>
  `;
}

function formatFamilyLogMessage(message) {
  return message
    .replace(/体調「良い」/g, "今日の様子「元気」")
    .replace(/体調「普通」/g, "今日の様子「いつも通り」")
    .replace(/体調「悪い」/g, "今日の様子「気になる」")
    .replace(/の体調「/g, "の様子「");
}

function formatFamilyLogTitle(log) {
  const condition = conditionFromLog(log);
  return condition ? `今日の様子: ${condition}` : log.title;
}

function getCategoryMarkers(tasks) {
  const counts = tasks.reduce((result, task) => {
    const category = getCategory(task.category);
    result[category] ||= { category, count: 0, activeCount: 0, doneCount: 0 };
    result[category].count += 1;
    if (task.done) {
      result[category].doneCount += 1;
    } else {
      result[category].activeCount += 1;
    }
    return result;
  }, {});

  return Object.values(counts)
    .sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category])
    .slice(0, 4);
}

function getCategory(category) {
  return categoryLabels[category] ? category : "medicine";
}

function getWhiteboardSlot(timeSlot) {
  if (timeSlot === "noon") return "noon";
  if (timeSlot === "evening" || timeSlot === "night") return "night";
  return "morning";
}

function getAddSlot(slot) {
  if (slot === "noon") return "noon";
  if (slot === "night") return "night";
  return "morning";
}

function setStatus(message, className) {
  elements.voiceStatus.className = `field-help ${className || ""}`.trim();
  elements.voiceStatus.textContent = message;
}

function showToast(message, actionLabel) {
  if (actionLabel) {
    elements.toast.innerHTML = `${escapeHtml(message)} <button type="button" data-toast-action="undo-delete">${escapeHtml(actionLabel)}</button>`;
  } else {
    elements.toast.textContent = message;
  }
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}

function updateReadabilityButton() {
  elements.readabilityButton.textContent = state.settings.largeText
    ? "標準に戻す"
    : "大きく表示";
}

function updateLoginStatus() {
  updateProfilePhoto();
}

function syncSettingsFields() {
  elements.loginName.value = state.settings.userName || "";
  elements.settingsUserName.value = state.settings.userName || "";
  elements.settingsFamilyName.value = state.settings.familyName || "";
  elements.settingsDefaultTime.value = state.settings.defaultReminderTime || "08:00";
  elements.settingsLargeText.checked = Boolean(state.settings.largeText);
  updateProfilePhoto();
}

function saveLogin() {
  const name = elements.loginName.value.trim() || "利用者";
  state.settings.userName = name;
  state.settings.loggedIn = true;
  saveSettings();
  syncSettingsFields();
  updateLoginStatus();
  showToast(`${name}さんでログインしました。`);
  state.view = "main";
  render();
}

function saveAppSettings() {
  state.settings.userName = elements.settingsUserName.value.trim();
  state.settings.familyName = elements.settingsFamilyName.value.trim();
  state.settings.defaultReminderTime = elements.settingsDefaultTime.value || "08:00";
  state.settings.largeText = elements.settingsLargeText.checked;
  saveSettings();
  elements.body.classList.toggle("large-text", state.settings.largeText);
  updateReadabilityButton();
  updateLoginStatus();
  showToast("設定を保存しました。");
  state.view = "main";
  render();
}

function handlePhotoUpload() {
  const file = elements.settingsPhoto.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.settings.profilePhoto = typeof reader.result === "string" ? reader.result : "";
    saveSettings();
    updateProfilePhoto();
    showToast("登録写真を保存しました。");
  });
  reader.readAsDataURL(file);
}

function updateProfilePhoto() {
  const photo = state.settings.profilePhoto || DEFAULT_PROFILE_PHOTO;
  const initial = profileInitial();
  elements.profileMenuInitial.textContent = initial;
  elements.settingsPhotoPreview.textContent = initial;

  if (photo) {
    elements.profileMenuPhoto.src = photo;
    elements.profileMenuPhoto.hidden = false;
    elements.profileMenuInitial.hidden = true;
    elements.settingsPhotoPreview.style.backgroundImage = `url("${photo}")`;
    elements.settingsPhotoPreview.classList.add("has-photo");
    return;
  }

  elements.profileMenuPhoto.removeAttribute("src");
  elements.profileMenuPhoto.hidden = true;
  elements.profileMenuInitial.hidden = false;
  elements.settingsPhotoPreview.style.backgroundImage = "";
  elements.settingsPhotoPreview.classList.remove("has-photo");
}

function profileInitial() {
  const name = state.settings.userName?.trim();
  return name ? name.slice(0, 1) : "人";
}

function updateVoiceGuideButton() {
  const isOn = Boolean(state.settings.voiceGuide);
  elements.voiceGuideToggle.checked = isOn;
  elements.voiceGuideState.textContent = isOn ? "ON" : "OFF";
}

function setVoiceGuideEnabled(enabled) {
  state.settings.voiceGuide = Boolean(enabled);
  saveSettings();
  updateVoiceGuideButton();
}

function speakAdvice() {
  const advice = elements.adviceText.textContent.trim();
  const message = advice
    ? `今日のアドバイスです。${advice}。続いて問診です。今日の様子を、元気、いつも通り、気になる、から選んでください。`
    : "今日のアドバイスはまだありません。続いて問診です。今日の様子を、元気、いつも通り、気になる、から選んでください。";
  speakText(message, () => setVoiceGuideEnabled(false));
  showToast("問診を開始します。");
}

function stopSpeech() {
  state.speechToken += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speakText(message, onDone) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    showToast(message);
    onDone?.();
    return;
  }

  window.speechSynthesis.cancel();
  const speechToken = state.speechToken + 1;
  state.speechToken = speechToken;
  const utterance = new SpeechSynthesisUtterance(message);
  let fallbackTimer = 0;
  const finish = () => {
    if (state.speechToken !== speechToken) return;
    clearTimeout(fallbackTimer);
    onDone?.();
  };
  utterance.lang = "ja-JP";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  utterance.onend = finish;
  utterance.onerror = finish;
  fallbackTimer = setTimeout(finish, estimatedSpeechDuration(message));
  window.speechSynthesis.speak(utterance);
}

function estimatedSpeechDuration(message) {
  return Math.min(Math.max(message.length * 160, 5000), 30000);
}

function defaultReminderTime(timeSlot) {
  const configuredTime = readDefaultReminderTimeSetting();
  const defaults = {
    morning: configuredTime,
    noon: "12:00",
    evening: "18:00",
    night: "21:00",
  };
  return defaults[timeSlot] || configuredTime;
}

function readDefaultReminderTimeSetting() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return settings.defaultReminderTime || "08:00";
  } catch {
    return "08:00";
  }
}

function addFamilyLog(message, task, options = {}) {
  state.familyLogs.unshift({
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    message,
    title: task.title,
    taskId: task.id,
    dateKey: task.dateKey || toLocalDateKey(new Date()),
    createdAt: new Date().toISOString(),
    locationUrl: options.location?.url || "",
    latitude: options.location?.latitude || null,
    longitude: options.location?.longitude || null,
    locationAccuracy: options.location?.accuracy || null,
  });
  state.familyLogs = state.familyLogs.slice(0, 20);
  saveFamilyLogs();
}

function getWeekDates(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return Array.from({ length: 7 }, (_, index) => {
    const result = new Date(start);
    result.setDate(start.getDate() + index);
    return result;
  });
}

function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatSelectedDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatLogTime(isoString) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function loadTasks() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const currentTasks = JSON.parse(current);
      if (currentTasks.every((task) => String(task.id || "").startsWith("sample-"))) {
        return sampleTasks();
      }
      return dedupeTasks(seedDummyTasksOnce(currentTasks.map(normaliseTask)));
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return sampleTasks();

    const legacyTasks = JSON.parse(legacy);
    if (legacyTasks.every((task) => String(task.id || "").startsWith("sample-"))) {
      return sampleTasks();
    }
    return dedupeTasks(seedDummyTasksOnce(legacyTasks.map(normaliseTask)));
  } catch {
    return sampleTasks();
  }
}

function seedDummyTasksOnce(tasks) {
  if (localStorage.getItem(DUMMY_SEED_KEY) === DUMMY_SEED_VERSION) return tasks;

  const existingKeys = new Set(tasks.map((task) => `${task.dateKey}|${getCategory(task.category)}|${task.title}`));
  const extraSamples = sampleTasks().filter((task) => {
    const key = `${task.dateKey}|${getCategory(task.category)}|${task.title}`;
    return !existingKeys.has(key);
  });
  const seededTasks = [...tasks, ...extraSamples].map(normaliseTask);
  localStorage.setItem(DUMMY_SEED_KEY, DUMMY_SEED_VERSION);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seededTasks));
  return seededTasks;
}

function dedupeTasks(tasks) {
  const seen = new Set();
  const deduped = tasks.filter((task) => {
    const key = `${task.dateKey}|${getCategory(task.category)}|${task.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length !== tasks.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  }

  return deduped;
}

function normaliseTask(task) {
  const category = getCategory(task.category || inferCategory(task.title || ""));

  return {
    id: task.id || String(Date.now()),
    title: task.title || "無題",
    category,
    note: task.note || "",
    dateKey: task.dateKey || toLocalDateKey(new Date()),
    timeSlot: task.timeSlot || "none",
    reminderTime: task.reminderTime || (category === "medicine" ? defaultReminderTime(task.timeSlot) : ""),
    done: Boolean(task.done),
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
    source: task.source || "",
    sourceId: task.sourceId || "",
  };
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadFamilyLogs() {
  try {
    const raw = localStorage.getItem(FAMILY_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(normaliseFamilyLog).filter(Boolean);
  } catch {
    return [];
  }
}

function normaliseFamilyLog(log) {
  if (!log || !log.message || !log.title) return null;
  return {
    id: log.id || String(Date.now()),
    message: log.message,
    title: log.title,
    taskId: log.taskId || "",
    dateKey: log.dateKey || toLocalDateKey(new Date(log.createdAt || Date.now())),
    createdAt: log.createdAt || new Date().toISOString(),
    locationUrl: log.locationUrl || "",
    latitude: Number.isFinite(log.latitude) ? log.latitude : null,
    longitude: Number.isFinite(log.longitude) ? log.longitude : null,
    locationAccuracy: Number.isFinite(log.locationAccuracy) ? log.locationAccuracy : null,
  };
}

function saveFamilyLogs() {
  localStorage.setItem(FAMILY_LOG_KEY, JSON.stringify(state.familyLogs));
}

function loadFamilyInvite() {
  try {
    const raw = localStorage.getItem(FAMILY_INVITE_KEY);
    return normaliseFamilyInvite(raw ? JSON.parse(raw) : {});
  } catch {
    return normaliseFamilyInvite({});
  }
}

function normaliseFamilyInvite(invite) {
  const normalised = {
    id: invite.id || makeInviteId(),
    linked: Boolean(invite.linked),
    createdAt: invite.createdAt || new Date().toISOString(),
  };
  localStorage.setItem(FAMILY_INVITE_KEY, JSON.stringify(normalised));
  return normalised;
}

function makeInviteId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < 6; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return normaliseSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return normaliseSettings({});
  }
}

function normaliseSettings(settings) {
  return {
    loggedIn: Boolean(settings.loggedIn),
    userName: typeof settings.userName === "string" ? settings.userName : "",
    familyName: typeof settings.familyName === "string" ? settings.familyName : "",
    profilePhoto: typeof settings.profilePhoto === "string" ? settings.profilePhoto : "",
    defaultReminderTime: settings.defaultReminderTime || "08:00",
    largeText: Boolean(settings.largeText),
    voiceGuide: false,
  };
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function sampleTasks() {
  const today = new Date();
  const tomorrow = new Date();
  const dayAfter = new Date();
  tomorrow.setDate(today.getDate() + 1);
  dayAfter.setDate(today.getDate() + 2);

  return [
    {
      id: "sample-1",
      title: "朝の薬を飲む",
      category: "medicine",
      note: "食後に水で飲む",
      dateKey: toLocalDateKey(today),
      timeSlot: "morning",
      reminderTime: "08:00",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "sample-2",
      title: "昼の薬を飲む",
      category: "medicine",
      note: "昼食後に確認",
      dateKey: toLocalDateKey(today),
      timeSlot: "noon",
      reminderTime: "12:30",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "sample-3",
      title: "内科の通院",
      category: "hospital",
      note: "診察券とお薬手帳を持つ",
      dateKey: toLocalDateKey(today),
      timeSlot: "morning",
      reminderTime: "10:30",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "sample-4",
      title: "夕方の散歩",
      category: "exercise",
      note: "無理のない距離で歩く",
      dateKey: toLocalDateKey(today),
      timeSlot: "evening",
      reminderTime: "16:00",
      done: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    {
      id: "sample-5",
      title: "水分をとる",
      category: "life",
      note: "コップ1杯を目安にする",
      dateKey: toLocalDateKey(today),
      timeSlot: "noon",
      reminderTime: "",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "sample-6",
      title: "通院の持ち物を確認",
      category: "hospital",
      note: "保険証、お薬手帳、診察券",
      dateKey: toLocalDateKey(tomorrow),
      timeSlot: "evening",
      reminderTime: "",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "sample-7",
      title: "ごみを出す",
      category: "life",
      note: "",
      dateKey: toLocalDateKey(dayAfter),
      timeSlot: "morning",
      reminderTime: "",
      done: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  ];
}

function inferCategory(title) {
  if (/薬|服薬|お薬/.test(title)) return "medicine";
  if (/通院|病院|診察|保険証/.test(title)) return "hospital";
  if (/体操|散歩|運動/.test(title)) return "exercise";
  return "life";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
