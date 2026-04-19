(function () {
  var STORAGE_KEY = "work_dashboard_state_v1";
  var EXPORT_VERSION = 1;
  var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var DEMO_TASK_TITLES = [
    "Deep work sprint",
    "Review imported backlog",
    "Prepare client notes",
    "Weekly clean-up",
    "Archive completed drafts",
  ];

  var conditionMap = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Heavy showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunder and hail",
    99: "Severe thunderstorm",
  };

  var elements = {
    topbarBrandPrimary: document.getElementById("topbarBrandPrimary"),
    topbarBrandSecondary: document.getElementById("topbarBrandSecondary"),
    topbarLocation: document.getElementById("topbarLocation"),
    topbarWeatherStatus: document.getElementById("topbarWeatherStatus"),
    topbarBackupStatus: document.getElementById("topbarBackupStatus"),
    topbarTimestamp: document.getElementById("topbarTimestamp"),
    viewToggleBtn: document.getElementById("viewToggleBtn"),
    dashboardView: document.getElementById("dashboardView"),
    statsView: document.getElementById("statsView"),
    sessionPanelLabel: document.getElementById("sessionPanelLabel"),
    sessionTimezone: document.getElementById("sessionTimezone"),
    sessionGreeting: document.getElementById("sessionGreeting"),
    sessionMeta: document.getElementById("sessionMeta"),
    clockTime: document.getElementById("clockTime"),
    clockSeconds: document.getElementById("clockSeconds"),
    clockLabel: document.getElementById("clockLabel"),
    agendaPanelLabel: document.getElementById("agendaPanelLabel"),
    operatorStats: document.getElementById("operatorStats"),
    operatorPanelLabel: document.getElementById("operatorPanelLabel"),
    operatorName: document.getElementById("operatorName"),
    operatorMeta: document.getElementById("operatorMeta"),
    exportJsonBtn: document.getElementById("exportJsonBtn"),
    importJsonBtn: document.getElementById("importJsonBtn"),
    importFileInput: document.getElementById("importFileInput"),
    newTaskBtn: document.getElementById("newTaskBtn"),
    flowPanelLabel: document.getElementById("flowPanelLabel"),
    weatherPanelLabel: document.getElementById("weatherPanelLabel"),
    weatherCity: document.getElementById("weatherCity"),
    weatherCondition: document.getElementById("weatherCondition"),
    weatherTemp: document.getElementById("weatherTemp"),
    weatherUpdateLabel: document.getElementById("weatherUpdateLabel"),
    weatherStatusGrid: document.getElementById("weatherStatusGrid"),
    weatherHourly: document.getElementById("weatherHourly"),
    weatherForecast: document.getElementById("weatherForecast"),
    weatherForm: document.getElementById("weatherForm"),
    weatherQuery: document.getElementById("weatherQuery"),
    weatherSetLocationBtn: document.getElementById("weatherSetLocationBtn"),
    weatherSuggestions: document.getElementById("weatherSuggestions"),
    weatherSearchStatus: document.getElementById("weatherSearchStatus"),
    weatherSearchLabel: document.getElementById("weatherSearchLabel"),
    selectedDayTitle: document.getElementById("selectedDayTitle"),
    selectedDaySubtitle: document.getElementById("selectedDaySubtitle"),
    agendaHeaderMeta: document.getElementById("agendaHeaderMeta"),
    weekStrip: document.getElementById("weekStrip"),
    agendaList: document.getElementById("agendaList"),
    flowSummaryLabel: document.getElementById("flowSummaryLabel"),
    flowBuckets: document.getElementById("flowBuckets"),
    previousWeekBtn: document.getElementById("previousWeekBtn"),
    nextWeekBtn: document.getElementById("nextWeekBtn"),
    statsViewEyebrow: document.getElementById("statsViewEyebrow"),
    statsViewTitle: document.getElementById("statsViewTitle"),
    statsPageMeta: document.getElementById("statsPageMeta"),
    statsCardCompletionLabel: document.getElementById("statsCardCompletionLabel"),
    statsCompletionRange: document.getElementById("statsCompletionRange"),
    statsCompletionValue: document.getElementById("statsCompletionValue"),
    statsCompletionUnit: document.getElementById("statsCompletionUnit"),
    statsCompletionMeta: document.getElementById("statsCompletionMeta"),
    statsCompletionChart: document.getElementById("statsCompletionChart"),
    statsCardPriorityLabel: document.getElementById("statsCardPriorityLabel"),
    statsPriorityMeta: document.getElementById("statsPriorityMeta"),
    statsPriorityList: document.getElementById("statsPriorityList"),
    statsCardProjectLabel: document.getElementById("statsCardProjectLabel"),
    statsProjectMeta: document.getElementById("statsProjectMeta"),
    statsProjectList: document.getElementById("statsProjectList"),
    statsCardHorizonLabel: document.getElementById("statsCardHorizonLabel"),
    statsLoadMeta: document.getElementById("statsLoadMeta"),
    statsHorizonList: document.getElementById("statsHorizonList"),
    taskDialog: document.getElementById("taskDialog"),
    taskForm: document.getElementById("taskForm"),
    closeDialogBtn: document.getElementById("closeDialogBtn"),
    cancelDialogBtn: document.getElementById("cancelDialogBtn"),
    deleteTaskBtn: document.getElementById("deleteTaskBtn"),
    dialogTitle: document.getElementById("dialogTitle"),
    dialogTaskId: document.getElementById("dialogTaskId"),
    dialogTaskTitle: document.getElementById("dialogTaskTitle"),
    dialogTaskDate: document.getElementById("dialogTaskDate"),
    dialogTaskTime: document.getElementById("dialogTaskTime"),
    dialogTaskProject: document.getElementById("dialogTaskProject"),
    dialogTaskPriority: document.getElementById("dialogTaskPriority"),
    dialogTaskStatus: document.getElementById("dialogTaskStatus"),
    dialogTaskDuration: document.getElementById("dialogTaskDuration"),
    dialogTaskDetails: document.getElementById("dialogTaskDetails"),
    addSubtaskBtn: document.getElementById("addSubtaskBtn"),
    subtaskList: document.getElementById("subtaskList"),
    subtaskTemplate: document.getElementById("subtaskTemplate"),
  };
  elements.themeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-theme-option]"));

  var state = loadState();
  var ui = {
    selectedDate: normalizeDate(state.meta.selectedDate) || todayIso(),
    weekAnchor: startOfWeek(normalizeDate(state.meta.selectedDate) || todayIso()),
    activeView: "dashboard",
    weather: null,
    weatherStatus: "Loading weather",
    weatherLoading: false,
    weatherSearchMessage: "Searches real places from Open-Meteo geocoding.",
    weatherSearchState: "neutral",
    weatherSuggestions: [],
    weatherSuggestRequestId: 0,
  };
  var clockIntervalId = null;
  var weatherSuggestTimerId = null;

  init();

  function init() {
    bindEvents();
    applyTheme(state.settings.theme || "day", false);
    setActiveView("dashboard");
    syncTopbar();
    renderAll();
    refreshWeather();
    updateClock();
    clockIntervalId = window.setInterval(updateClock, 1000);
    window.requestAnimationFrame(function () {
      document.body.classList.add("app-ready");
    });
  }

  function bindEvents() {
    elements.exportJsonBtn.addEventListener("click", exportStateAsJson);
    elements.importJsonBtn.addEventListener("click", function () {
      elements.importFileInput.click();
    });
    elements.importFileInput.addEventListener("change", handleImportFile);
    elements.newTaskBtn.addEventListener("click", function () {
      openTaskDialog();
    });
    elements.viewToggleBtn.addEventListener("click", function () {
      setActiveView(ui.activeView === "dashboard" ? "stats" : "dashboard");
    });
    elements.themeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyTheme(button.getAttribute("data-theme-option"), true);
      });
    });
    elements.weatherForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = elements.weatherQuery.value.trim();
      if (!query) {
        return;
      }
      refreshWeather(query);
    });
    elements.weatherQuery.addEventListener("input", function () {
      var query = elements.weatherQuery.value.trim();
      window.clearTimeout(weatherSuggestTimerId);
      if (query.length < 2) {
        ui.weatherSuggestions = [];
        ui.weatherSearchMessage = defaultWeatherSearchMessage();
        ui.weatherSearchState = "neutral";
        renderWeatherSuggestions([]);
        renderWeatherCard();
        return;
      }
      ui.weatherSearchMessage = 'Searching places for "' + query + '"';
      ui.weatherSearchState = "neutral";
      renderWeatherCard();
      weatherSuggestTimerId = window.setTimeout(function () {
        updateWeatherSuggestions(query);
      }, 220);
    });
    elements.previousWeekBtn.addEventListener("click", function () {
      ui.weekAnchor = addDays(ui.weekAnchor, -7);
      renderWeekStrip();
    });
    elements.nextWeekBtn.addEventListener("click", function () {
      ui.weekAnchor = addDays(ui.weekAnchor, 7);
      renderWeekStrip();
    });
    elements.weekStrip.addEventListener("click", function (event) {
      var button = event.target.closest("[data-date]");
      if (!button) {
        return;
      }
      ui.selectedDate = button.getAttribute("data-date");
      ui.weekAnchor = startOfWeek(ui.selectedDate);
      state.meta.selectedDate = ui.selectedDate;
      saveState();
      renderAll();
    });
    elements.agendaList.addEventListener("click", function (event) {
      var toggle = event.target.closest("[data-toggle-task]");
      if (toggle) {
        var taskId = toggle.getAttribute("data-toggle-task");
        toggleTaskCompletion(taskId, event.target.checked);
        return;
      }
      var openButton = event.target.closest("[data-open-task]");
      if (openButton) {
        openTaskDialog(openButton.getAttribute("data-open-task"));
      }
    });
    elements.flowBuckets.addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open-task]");
      if (!openButton) {
        return;
      }
      openTaskDialog(openButton.getAttribute("data-open-task"));
    });
    elements.closeDialogBtn.addEventListener("click", closeTaskDialog);
    elements.cancelDialogBtn.addEventListener("click", closeTaskDialog);
    elements.deleteTaskBtn.addEventListener("click", deleteCurrentTask);
    elements.addSubtaskBtn.addEventListener("click", function () {
      appendSubtaskRow();
    });
    elements.subtaskList.addEventListener("click", function (event) {
      var removeButton = event.target.closest(".subtask-row__remove");
      if (!removeButton) {
        return;
      }
      removeButton.closest(".subtask-row").remove();
    });
    elements.taskForm.addEventListener("submit", saveTaskFromDialog);
    elements.taskDialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeTaskDialog();
    });
  }

  function renderAll() {
    renderThemeCopy();
    renderSessionCard();
    renderOperatorCard();
    renderWeekStrip();
    renderAgendaCard();
    renderFlowCard();
    renderWeatherCard();
    renderStatsView();
    syncTopbar();
  }

  function renderThemeCopy() {
    elements.topbarBrandPrimary.textContent = copyText("brandPrimary");
    elements.topbarBrandSecondary.textContent = copyText("brandSecondary");
    elements.sessionPanelLabel.textContent = copyText("sessionPanelLabel");
    elements.agendaPanelLabel.textContent = copyText("agendaPanelLabel");
    elements.operatorPanelLabel.textContent = copyText("operatorPanelLabel");
    elements.operatorName.textContent = copyText("operatorName");
    elements.operatorMeta.textContent = copyText("operatorMeta");
    elements.newTaskBtn.textContent = copyText("newTaskButton");
    elements.exportJsonBtn.textContent = copyText("downloadJsonButton");
    elements.importJsonBtn.textContent = copyText("uploadJsonButton");
    elements.flowPanelLabel.textContent = copyText("flowPanelLabel");
    elements.weatherPanelLabel.textContent = copyText("weatherPanelLabel");
    elements.weatherSearchLabel.textContent = copyText("weatherSearchLabel");
    elements.weatherSetLocationBtn.textContent = copyText("weatherSubmitButton");
    elements.weatherQuery.placeholder = copyText("weatherSearchPlaceholder");
    elements.statsViewEyebrow.textContent = copyText("statsViewEyebrow");
    elements.statsViewTitle.textContent = copyText("statsViewTitle");
    elements.statsCardCompletionLabel.textContent = copyText("statsCardCompletionLabel");
    elements.statsCompletionUnit.textContent = copyText("statsCompletionUnit");
    elements.statsCardPriorityLabel.textContent = copyText("statsCardPriorityLabel");
    elements.statsCardProjectLabel.textContent = copyText("statsCardProjectLabel");
    elements.statsCardHorizonLabel.textContent = copyText("statsCardHorizonLabel");
    refreshViewToggleLabel();
  }

  function refreshViewToggleLabel() {
    var showingStats = ui.activeView === "stats";
    elements.viewToggleBtn.textContent = showingStats ? copyText("dashboardButton") : copyText("statsButton");
    elements.viewToggleBtn.setAttribute(
      "aria-label",
      showingStats ? copyText("dashboardButton") : copyText("statsButton")
    );
  }

  function currentTheme() {
    return state.settings.theme || "day";
  }

  function isHongKongTheme() {
    return currentTheme() === "hongkong";
  }

  function copyText(key) {
    var hongKongCopy = {
      brandPrimary: "GUNG1 ZOK3 TOI4 // 工作台",
      brandSecondary: "Hoeng1 Gong2 jat6 cing4 香港日程",
      statsButton: "Tung2 Gai3 統計",
      dashboardButton: "Gung1 Zok3 Toi4 工作台",
      sessionPanelLabel: "01 // SI5 TOU5 時段",
      agendaPanelLabel: "02 // JAT6 CING4 日程",
      operatorPanelLabel: "03 // BAN2 GUNG1 辦公",
      operatorName: "Ban2 Gung1 Toi4 辦公台",
      operatorMeta: "Hoeng1 Gong2 jat6 gung1 zit3 zau6 香港日工節奏",
      newTaskButton: "Jan1 jam6 mou6 新任務",
      downloadJsonButton: "Haa6 zoi6 JSON 下載 JSON",
      uploadJsonButton: "Soeng5 zoi6 JSON 上載 JSON",
      flowPanelLabel: "04 // JI1 GAA1 / ZIP3 ZOK6 / HAU6 MIN6",
      weatherPanelLabel: "05 // TIN1 HEI3 TOI4 天氣台",
      weatherSearchLabel: "Goi2 tin1 hei3 dei6 dim2 改天氣地點",
      weatherSubmitButton: "Set 地點",
      weatherSearchPlaceholder: "Jam6 jat6 se2 city，bei2 jyu4 Hong Kong",
      statsViewEyebrow: "TUNG2 GAI3 統計",
      statsViewTitle: "Jat6 Mou6 Koi3 Laam4 任務概覽",
      statsCardCompletionLabel: "01 // JYUN4 SING4 ZIT3 ZAU6",
      statsCompletionUnit: "jyun4 sing4 完成",
      statsCardPriorityLabel: "02 // JUNG6 JIU3 DOU6 FAN1 BOU3",
      statsCardProjectLabel: "03 // HUNG6 MUK6 FAN1 BOU3",
      statsCardHorizonLabel: "04 // HAU6 BIN6 JAT6 CING4",
    };
    var defaultCopy = {
      brandPrimary: "WORK DASHBOARD //",
      brandSecondary: "Task Console v1.0",
      statsButton: "Statistics",
      dashboardButton: "Dashboard",
      sessionPanelLabel: "01 // SESSION",
      agendaPanelLabel: "02 // DAY PLAN",
      operatorPanelLabel: "03 // OPERATOR",
      operatorName: "Focus Console",
      operatorMeta: "Workday command deck",
      newTaskButton: "New task",
      downloadJsonButton: "Download JSON",
      uploadJsonButton: "Upload JSON",
      flowPanelLabel: "04 // NOW / NEXT / LATER",
      weatherPanelLabel: "05 // WEATHER DESK",
      weatherSearchLabel: "Change weather location",
      weatherSubmitButton: "Set location",
      weatherSearchPlaceholder: "Type a city, e.g. Tokyo",
      statsViewEyebrow: "STATISTICS",
      statsViewTitle: "Data Snapshot",
      statsCardCompletionLabel: "01 // COMPLETION CADENCE",
      statsCompletionUnit: "completions",
      statsCardPriorityLabel: "02 // PRIORITY BALANCE",
      statsCardProjectLabel: "03 // PROJECT SPREAD",
      statsCardHorizonLabel: "04 // LOAD HORIZON",
    };
    return (isHongKongTheme() ? hongKongCopy : defaultCopy)[key];
  }

  function renderSessionCard() {
    var now = new Date();
    var timezone = getBrowserTimezone();
    elements.sessionTimezone.textContent = isHongKongTheme()
      ? timezone + " \u00B7 bun2 dei6 si4 keoi1 本地時區"
      : timezone.toUpperCase();
    elements.sessionGreeting.textContent = buildGreeting(now);
    elements.sessionMeta.textContent =
      formatLongDate(now) +
      " \u00B7 " +
      formatTasksInViewCount(countTasksForDate(ui.selectedDate));
  }

  function renderOperatorCard() {
    var stats = [
      { label: isHongKongTheme() ? "Jip3 zung1 接中" : "Focus", value: buildFocusLabel() },
      { label: isHongKongTheme() ? "Zong6 taai3 狀態" : "Status", value: countOpenTasks() > 0 ? (isHongKongTheme() ? "waan4 zung6 行緊" : "Active") : (isHongKongTheme() ? "cing4 hung1 清空" : "Clear") },
      { label: isHongKongTheme() ? "Doi6 ban6 待辦" : "Pending", value: String(countPendingTasks()) },
      { label: isHongKongTheme() ? "Cyun4 存" : "Saved", value: formatLastSaved(state.meta.lastSavedAt) },
    ];

    elements.operatorStats.innerHTML = stats
      .map(function (stat) {
        return (
          '<div class="operator-stat">' +
          '<span class="operator-stat__label">' +
          escapeHtml(stat.label) +
          "</span>" +
          '<span class="operator-stat__value">' +
          escapeHtml(stat.value) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderWeekStrip() {
    var days = [];
    for (var index = 0; index < 7; index += 1) {
      var date = addDays(ui.weekAnchor, index);
      var isSelected = date === ui.selectedDate;
      days.push(
        '<button class="week-day' +
          (isSelected ? " week-day--selected" : "") +
          '" type="button" data-date="' +
          date +
          '">' +
          '<span class="week-day__label">' +
          formatWeekdayShort(date) +
          "</span>" +
          '<span class="week-day__number">' +
          date.slice(-2) +
          "</span>" +
          "</button>"
      );
    }
    elements.weekStrip.innerHTML = days.join("");
  }

  function renderAgendaCard() {
    elements.selectedDayTitle.textContent = formatReadableDate(ui.selectedDate);
    elements.selectedDaySubtitle.textContent = summarizeSelectedDay();
    var tasks = getTasksForDate(ui.selectedDate);
    elements.agendaHeaderMeta.textContent = formatVisibleTasksCount(tasks.length);
    if (!tasks.length) {
      elements.agendaList.innerHTML =
        '<div class="agenda-empty"><div><strong>' +
        escapeHtml(isHongKongTheme() ? "Hung1 dong6 空檔" : "Open runway") +
        "</strong><span>" +
        escapeHtml(
          isHongKongTheme()
            ? "Gaap3 jap6 jam6 mou6 加入任務，或者匯入 JSON 備份。"
            : "Add a task in the board card or import a saved session JSON."
        ) +
        "</span></div></div>";
      return;
    }

    elements.agendaList.innerHTML = tasks
      .map(function (task) {
        var timeLabel = task.time ? formatTimeLabel(task.time) : isHongKongTheme() ? "Mui5 ding6 si4 未定時" : "Any time";
        var details = [];
        if (task.project) {
          details.push(task.project);
        }
        if (task.details) {
          details.push(trimText(task.details, 72));
        } else if (task.subtasks.length) {
          details.push(
            isHongKongTheme()
              ? task.subtasks.length + " gin6 zi2 jam6 mou6 子任務"
              : task.subtasks.length + " subtasks"
          );
        } else {
          details.push(
            isHongKongTheme()
              ? priorityLabel(task.priority) + " sin1 hau6 優先"
              : priorityLabel(task.priority) + " priority"
          );
        }
        return (
          '<div class="task-row task-row--' +
          escapeHtml(task.status) +
          '">' +
          '<div class="task-row__time">' +
          escapeHtml(timeLabel) +
          "</div>" +
          '<label class="task-row__checkbox">' +
          '<input type="checkbox" data-toggle-task="' +
          escapeHtml(task.id) +
          '"' +
          (task.status === "done" ? " checked" : "") +
          " />" +
          "</label>" +
          '<div class="task-row__content" data-open-task="' +
          escapeHtml(task.id) +
          '">' +
          '<p class="task-row__title">' +
          escapeHtml(task.title) +
          "</p>" +
          '<p class="task-row__details">' +
          escapeHtml(details.join(" \u00B7 ")) +
          "</p>" +
          "</div>" +
          '<div class="task-row__meta">' +
          '<span class="task-row__priority">' +
          escapeHtml(priorityLabel(task.priority)) +
          "</span>" +
          '<button class="button button--ghost task-row__edit" type="button" data-open-task="' +
          escapeHtml(task.id) +
          '">' +
          escapeHtml(isHongKongTheme() ? "Sai3 cing4 細情" : "Details") +
          "</button>" +
          "</div>" +
          '<span class="task-row__state-dot" aria-hidden="true"></span>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderFlowCard() {
    var queue = getFocusQueue();
    var nowTask = queue[0] || null;
    var nextTask = queue[1] || null;
    var laterTasks = queue.slice(2, 5);

    elements.flowSummaryLabel.textContent = queue.length
      ? isHongKongTheme()
        ? queue.length + " gin6 doi6 ban6 待辦"
        : queue.length + " queued"
      : isHongKongTheme()
      ? "Hung1 空檔"
      : "Clear";
    elements.flowBuckets.innerHTML = [
      buildFocusBucket(isHongKongTheme() ? "Ji1 gaa1 而家" : "Now", nowTask, "now"),
      buildFocusBucket(isHongKongTheme() ? "Zip3 zok6 接續" : "Next", nextTask, "next"),
      buildLaterBucket(laterTasks),
    ].join("");
  }

  function renderStatsView() {
    var completionSeries = buildCompletionSeries(14);
    var completionTotal = sumNumbers(completionSeries);
    var averagePerDay = completionSeries.length ? (completionTotal / completionSeries.length).toFixed(1) : "0.0";
    elements.statsCompletionRange.textContent = isHongKongTheme() ? "ZEUI3 GAN6 14 JAT6 最近14日" : "LAST 14 DAYS";
    elements.statsCompletionValue.textContent = String(completionTotal);
    elements.statsCompletionMeta.textContent = isHongKongTheme()
      ? "Ping4 gwan1 " +
        averagePerDay +
        " / jat6 \u00B7 zeoi3 gan6 jat1 zau1 " +
        countCompletionsWithinDays(7) +
        " jyun4 sing4"
      : averagePerDay + " per day \u00B7 " + countCompletionsWithinDays(7) + " completed in the last week";
    elements.statsCompletionChart.innerHTML = buildSparkline(completionSeries);

    elements.statsPageMeta.textContent = isHongKongTheme()
      ? state.tasks.length +
        " gin6 jam6 mou6 \u00B7 " +
        countPendingTasks() +
        " gin6 mei6 jyun4 sing4 \u00B7 " +
        countOpenSubtasks() +
        " gin6 mei6 jyun4 sing4 zi2 jam6 mou6"
      : state.tasks.length +
        " tasks total \u00B7 " +
        countPendingTasks() +
        " open \u00B7 " +
        countOpenSubtasks() +
        " open subtasks";

    renderPriorityStats();
    renderProjectStats();
    renderHorizonStats();
  }

  function setActiveView(viewName) {
    ui.activeView = viewName === "stats" ? "stats" : "dashboard";
    var showingStats = ui.activeView === "stats";
    elements.dashboardView.hidden = showingStats;
    elements.statsView.hidden = !showingStats;
    refreshViewToggleLabel();
  }

  function applyTheme(themeName, persist) {
    var theme = ["day", "night", "hongkong"].indexOf(themeName) >= 0 ? themeName : "day";
    var shouldForceHongKongWeather = theme === "hongkong" && (persist || !isHongKongWeatherSelected());
    document.body.setAttribute("data-theme", theme);
    elements.themeButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-theme-option") === theme;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    state.settings.theme = theme;
    if (shouldForceHongKongWeather) {
      applyHongKongWeatherPreset();
    }
    renderAll();
    refreshViewToggleLabel();
    if (persist || shouldForceHongKongWeather) {
      saveState();
    }
    if (shouldForceHongKongWeather) {
      refreshWeather("Hong Kong");
    }
  }

  function buildFocusBucket(label, task, variant) {
    if (!task) {
      return (
        '<section class="flow-bucket flow-bucket--' +
        variant +
        '">' +
        '<div class="flow-bucket__header">' +
        '<span class="flow-bucket__label">' +
        label +
        "</span>" +
        '<span class="flow-bucket__time">' +
        escapeHtml(isHongKongTheme() ? "HUNG1 空檔" : "CLEAR") +
        "</span>" +
        "</div>" +
        '<p class="flow-bucket__empty">' +
        escapeHtml(
          isHongKongTheme() ? "Ni1 go3 wai6 ji1 gaa1 mei6 jau5 jam6 mou6. 呢格而家未有任務。" : "No task is parked here right now."
        ) +
        "</p>" +
        "</section>"
      );
    }

    return (
      '<section class="flow-bucket flow-bucket--' +
      variant +
      '">' +
      '<div class="flow-bucket__header">' +
      '<span class="flow-bucket__label">' +
      label +
      "</span>" +
      '<span class="flow-bucket__time">' +
      escapeHtml(
        task.time
          ? formatTimeLabel(task.time)
          : task.date === ui.selectedDate
          ? isHongKongTheme()
            ? "Mui5 ding6 si4 未定時"
            : "Any time"
          : formatShortDate(task.date)
      ) +
      "</span>" +
      "</div>" +
      '<h3 class="flow-bucket__title">' +
      escapeHtml(task.title) +
      "</h3>" +
      '<p class="flow-bucket__meta">' +
      escapeHtml(buildTaskDescriptor(task)) +
      "</p>" +
      '<p class="flow-bucket__details">' +
      escapeHtml(
        task.details
          ? trimText(task.details, 110)
          : isHongKongTheme()
          ? "Hoi1 jam6 mou6 去加筆記、subtasks 同工作細節。"
          : "Open the task to add notes, subtasks, and working detail."
      ) +
      "</p>" +
      '<button class="button button--ghost flow-bucket__button" type="button" data-open-task="' +
      escapeHtml(task.id) +
      '">' +
      escapeHtml(isHongKongTheme() ? "Hoi1 開" : "Open") +
      "</button>" +
      "</section>"
    );
  }

  function buildLaterBucket(tasks) {
    if (!tasks.length) {
      return (
        '<section class="flow-bucket flow-bucket--later">' +
        '<div class="flow-bucket__header"><span class="flow-bucket__label">' +
        escapeHtml(isHongKongTheme() ? "Hau6 min6 後面" : "Later") +
        '</span><span class="flow-bucket__time">' +
        escapeHtml(isHongKongTheme() ? "HUNG1 空檔" : "CLEAR") +
        '</span></div>' +
        '<p class="flow-bucket__empty">' +
        escapeHtml(
          isHongKongTheme()
            ? "Hau6 min6 zung6 jau5 wai2，ho2 ji5 zoi3 ga1 gei2 go3 jam6 mou6. 後面仲有位，可以再加幾個任務。"
            : "No later queue yet. Add more tasks if you want a runway beyond the current focus."
        ) +
        "</p>" +
        "</section>"
      );
    }

    return (
      '<section class="flow-bucket flow-bucket--later">' +
      '<div class="flow-bucket__header"><span class="flow-bucket__label">' +
      escapeHtml(isHongKongTheme() ? "Hau6 min6 後面" : "Later") +
      '</span><span class="flow-bucket__time">' +
      tasks.length +
      (isHongKongTheme() ? " gin6 doi6 ban6 待辦" : " queued") +
      "</span></div>" +
      '<div class="flow-bucket__list">' +
      tasks
        .map(function (task) {
          return (
            '<div class="flow-bucket__list-item">' +
            '<button class="flow-bucket__list-button" type="button" data-open-task="' +
            escapeHtml(task.id) +
            '">' +
            '<span class="flow-bucket__list-title">' +
            escapeHtml(task.title) +
            "</span>" +
            '<span class="flow-bucket__list-meta">' +
            escapeHtml(buildTaskDescriptor(task)) +
            "</span>" +
            "</button>" +
            '<span class="flow-bucket__list-time">' +
            escapeHtml(
              task.time
                ? formatTimeLabel(task.time)
                : isHongKongTheme() && task.date === ui.selectedDate
                ? "Mui5 ding6 si4 未定時"
                : formatShortDate(task.date)
            ) +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      "</section>"
    );
  }

  function renderPriorityStats() {
    var openTasks = state.tasks.filter(function (task) {
      return task.status !== "done";
    });
    var total = openTasks.length || 1;
    var counts = ["urgent", "high", "medium", "low"].map(function (priority) {
      return {
        label: priorityLabel(priority),
        value: openTasks.filter(function (task) {
          return task.priority === priority;
        }).length,
      };
    });

    elements.statsPriorityMeta.textContent = isHongKongTheme()
      ? openTasks.length + " gin6 mei6 jyun4 sing4 未完成"
      : openTasks.length + " open tasks";
    elements.statsPriorityList.innerHTML = counts
      .map(function (item) {
        return buildStatsBarRow(item.label, item.value, Math.round((item.value / total) * 100));
      })
      .join("");
  }

  function renderProjectStats() {
    var projects = buildProjectStats().slice(0, 4);
    elements.statsProjectMeta.textContent = projects.length
      ? isHongKongTheme()
        ? "zung6 dim2 hung6 muk6 重點項目"
        : "top active projects"
      : isHongKongTheme()
      ? "mou5 hung6 muk6 naam4 冇項目名"
      : "no projects yet";
    elements.statsProjectList.innerHTML = projects.length
      ? projects
          .map(function (project) {
            return (
              '<div class="stats-row">' +
              '<div class="stats-row__project">' +
              '<strong>' +
              escapeHtml(project.name) +
              "</strong>" +
              '<span>' +
              escapeHtml(
                isHongKongTheme()
                  ? project.open + " mei6 jyun4 sing4 \u00B7 " + project.done + " jyun4 sing4"
                  : project.open + " open \u00B7 " + project.done + " done"
              ) +
              "</span>" +
              "</div>" +
              '<div class="stats-row__bar"><span style="width:' +
              project.progress +
              '%"></span></div>' +
              '<span class="stats-row__value">' +
              escapeHtml(isHongKongTheme() ? project.total + " gin6 jam6 mou6" : project.total + " tasks") +
              "</span>" +
              "</div>"
            );
          })
          .join("")
      : '<p class="flow-bucket__empty">' +
        escapeHtml(
          isHongKongTheme()
            ? "Ga1 project ming4 先會睇到 hung6 muk6 fan1 bou3. 加 project 名先會睇到項目分佈。"
            : "Start grouping tasks with project names to get a clearer project spread."
        ) +
        "</p>";
  }

  function renderHorizonStats() {
    var rows = buildHorizonRows(7);
    elements.statsLoadMeta.textContent = isHongKongTheme() ? "haa6 jat1 zau1 下1周" : "next 7 days";
    elements.statsHorizonList.innerHTML = rows
      .map(function (row) {
        return buildStatsBarRow(row.label, row.count, row.percent, row.meta);
      })
      .join("");
  }

  function buildStatsBarRow(label, value, percent, meta) {
    var safePercent = percent > 0 ? Math.max(8, percent) : 0;
    return (
      '<div class="stats-row">' +
      '<span class="stats-row__label">' +
      escapeHtml(label) +
      "</span>" +
      '<div class="stats-row__bar"><span style="width:' +
      safePercent +
      '%"></span></div>' +
      '<span class="stats-row__value">' +
      escapeHtml(String(value)) +
      (meta ? '<span class="stats-row__meta"> ' + escapeHtml(meta) + "</span>" : "") +
      "</span>" +
      "</div>"
    );
  }

  function renderWeatherCard() {
    if (document.activeElement !== elements.weatherQuery) {
      elements.weatherQuery.value = state.settings.locationName || state.settings.locationQuery || "";
    }
    elements.weatherSearchStatus.textContent = ui.weatherSearchMessage || defaultWeatherSearchMessage();
    elements.weatherSearchStatus.dataset.state = ui.weatherSearchState || "neutral";
    if (!ui.weather) {
      elements.weatherCity.textContent = state.settings.locationName || state.settings.locationQuery || "Oslo, Norway";
      elements.weatherCondition.textContent = ui.weatherStatus;
      elements.weatherTemp.textContent = "--°";
      elements.weatherUpdateLabel.textContent = "STANDBY";
      elements.weatherStatusGrid.innerHTML = buildWeatherPlaceholders();
      elements.weatherHourly.innerHTML = "";
      elements.weatherForecast.innerHTML = "";
      return;
    }

    var weather = ui.weather;
    elements.weatherCity.textContent = weather.city;
    elements.weatherCondition.textContent = weather.condition;
    elements.weatherTemp.textContent = Math.round(weather.temperature) + "°";
    elements.weatherUpdateLabel.textContent = isHongKongTheme()
      ? "GENG1 SAN1 " + timeAgo(weather.updatedAt)
      : "UPDATED " + timeAgo(weather.updatedAt);
    elements.weatherStatusGrid.innerHTML = [
      buildWeatherStat(isHongKongTheme() ? "Gam2 gok3 wun1 dou6 體感" : "Feels like", Math.round(weather.feelsLike) + "°"),
      buildWeatherStat(isHongKongTheme() ? "Fung1 lik6 風力" : "Wind", Math.round(weather.windSpeed) + " km/h"),
      buildWeatherStat(isHongKongTheme() ? "Lok6 jyu5 gei1 wui6 落雨機會" : "Rain chance", weather.rainChance + "%"),
      buildWeatherStat(isHongKongTheme() ? "Si4 keoi1 時區" : "Timezone", weather.timezone),
    ].join("");
    elements.weatherHourly.innerHTML = weather.hourly
      .map(function (entry) {
        return (
          '<div class="hourly-row">' +
          '<span class="hourly-row__time">' +
          escapeHtml(entry.label) +
          "</span>" +
          '<div class="hourly-row__bar"><span style="width:' +
          entry.barWidth +
          '%"></span></div>' +
          '<span class="hourly-row__temp">' +
          escapeHtml(entry.tempLabel) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
    elements.weatherForecast.innerHTML = weather.forecast
      .map(function (entry) {
        return (
          '<div class="forecast-row">' +
          '<span class="forecast-row__day">' +
          escapeHtml(entry.day) +
          "</span>" +
          '<span class="forecast-row__condition">' +
          escapeHtml(entry.condition) +
          "</span>" +
          '<span class="forecast-row__range">' +
          escapeHtml(entry.range) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function updateClock() {
    var now = new Date();
    elements.clockTime.textContent = now.toLocaleTimeString(getDisplayLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    elements.clockSeconds.textContent = String(now.getSeconds()).padStart(2, "0");
    elements.clockLabel.textContent = isHongKongTheme() ? "Bun2 dei6 si4 gaan1 本地時間" : "LOCAL TIME";
    elements.topbarTimestamp.textContent =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "-" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    renderSessionCard();
  }

  function syncTopbar() {
    var locationLabel = state.settings.locationName || state.settings.locationQuery || "OSLO, NO";
    elements.topbarLocation.textContent = isHongKongTheme() ? locationLabel : locationLabel.toUpperCase();
    elements.topbarWeatherStatus.textContent = isHongKongTheme()
      ? ui.weatherLoading
        ? "Tin1 hei3 zung2 gaai3 jung6 天氣同步中"
        : ui.weather
        ? "Tin1 hei3 ok 天氣已到"
        : "Tin1 hei3 deoi6 zip3 天氣待接"
      : (ui.weatherStatus || "WEATHER READY").toUpperCase();
    elements.topbarBackupStatus.textContent = isHongKongTheme()
      ? "Bun2 dei6 bak1 fan6 本地備份 " + formatLastSaved(state.meta.lastSavedAt)
      : ("Local backup " + formatLastSaved(state.meta.lastSavedAt)).toUpperCase();
  }

  function refreshWeather(optionalQuery) {
    var query = optionalQuery || state.settings.locationQuery || "Oslo";
    var savedLocation = getSavedLocation();
    ui.weatherLoading = true;
    ui.weatherStatus = optionalQuery ? (isHongKongTheme() ? "zoek3 gan2 " + query + " ge3 dei6 dim2" : "Resolving " + query) : isHongKongTheme() ? "zoek6 gan2 " + (savedLocation.displayName || query) : "Loading " + (savedLocation.displayName || query);
    ui.weatherSearchMessage = optionalQuery
      ? isHongKongTheme()
        ? 'zoek3 gan2 "' + query + '" ge3 jan4 sat6 dei6 dim2. 搜緊真實地點。'
        : 'Checking real places for "' + query + '"'
      : isHongKongTheme()
      ? "jau5 dei6 dim2 match: " + (savedLocation.displayName || state.settings.locationName || query)
      : "Resolved place: " + (savedLocation.displayName || state.settings.locationName || query);
    ui.weatherSearchState = optionalQuery ? "neutral" : "success";
    renderWeatherCard();
    syncTopbar();

    resolveWeatherLocation(query, optionalQuery ? null : savedLocation)
      .then(function (location) {
        return fetchWeatherForecast(location).then(function (forecast) {
          ui.weather = transformWeather(forecast, location);
          ui.weatherStatus = isHongKongTheme() ? "tin1 hei3 zeon3 zo2" : "Weather ready";
          ui.weatherSearchMessage = isHongKongTheme()
            ? "match dou2 " + location.displayName + " 呢個地點"
            : "Matched to " + location.displayName;
          ui.weatherSearchState = "success";
          return forecast;
        });
      })
      .catch(function (error) {
        ui.weatherStatus = error.message || "Weather unavailable";
        ui.weatherSearchMessage = error.message || "Weather unavailable";
        ui.weatherSearchState = "error";
      })
      .finally(function () {
        ui.weatherLoading = false;
        renderWeatherCard();
        syncTopbar();
      });
  }

  function updateWeatherSuggestions(query) {
    var requestId = ++ui.weatherSuggestRequestId;
    geocodeLocation(query, 5)
      .then(function (results) {
        if (requestId !== ui.weatherSuggestRequestId || elements.weatherQuery.value.trim() !== query) {
          return;
        }
        ui.weatherSuggestions = results;
        renderWeatherSuggestions(ui.weatherSuggestions);
        ui.weatherSearchMessage = results.length
          ? isHongKongTheme()
            ? "cin2 jat6 jat6 go3 match，或者撳 Set location. 揀一個地點 match。"
            : "Choose a real place match or press Set location."
          : isHongKongTheme()
          ? 'mou5 zoek3 dou2 "' + query + '" ge3 dei6 dim2.'
          : 'No places found for "' + query + '"';
        ui.weatherSearchState = results.length ? "neutral" : "error";
        renderWeatherCard();
      })
      .catch(function () {
        if (requestId !== ui.weatherSuggestRequestId) {
          return;
        }
        ui.weatherSuggestions = [];
        renderWeatherSuggestions([]);
        ui.weatherSearchMessage = isHongKongTheme()
          ? "ji1 gaa1 zoek3 m4 dou2 dei6 dim2. 而家搵唔到地點。"
          : "Could not search places right now.";
        ui.weatherSearchState = "error";
        renderWeatherCard();
      });
  }

  function renderWeatherSuggestions(results) {
    elements.weatherSuggestions.innerHTML = results
      .map(function (location) {
        return '<option value="' + escapeHtml(location.displayName) + '"></option>';
      })
      .join("");
  }

  function resolveWeatherLocation(query, presetLocation) {
    if (presetLocation && presetLocation.latitude && presetLocation.longitude) {
      return Promise.resolve(presetLocation);
    }
    return geocodeLocation(query, 8).then(function (results) {
      if (!results.length) {
        throw new Error('No real location found for "' + query + '"');
      }
      var resolved = selectBestLocation(query, results);
      if (!resolved) {
        throw new Error('No real location found for "' + query + '"');
      }
      applyResolvedLocation(query, resolved);
      return resolved;
    });
  }

  function geocodeLocation(query, count) {
    return fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
        encodeURIComponent(query) +
        "&count=" +
        encodeURIComponent(count || 5) +
        "&language=en&format=json"
    )
      .then(assertOk)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        return (data.results || []).map(function (location) {
          return formatResolvedLocation(location, query);
        });
      });
  }

  function fetchWeatherForecast(location) {
    return fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" +
        encodeURIComponent(location.latitude) +
        "&longitude=" +
        encodeURIComponent(location.longitude) +
        "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=5&timezone=auto"
    )
      .then(assertOk)
      .then(function (response) {
        return response.json();
      });
  }

  function applyResolvedLocation(query, location) {
    state.settings.locationQuery = query;
    state.settings.locationName = location.displayName;
    state.settings.locationId = location.id || null;
    state.settings.locationAdmin1 = location.admin1 || "";
    state.settings.countryCode = location.country_code || "";
    state.settings.latitude = location.latitude;
    state.settings.longitude = location.longitude;
    state.settings.timezone = location.timezone || state.settings.timezone;
    saveState();
  }

  function applyHongKongWeatherPreset() {
    state.settings.locationQuery = "Hong Kong";
    state.settings.locationName = "Hong Kong, Hong Kong";
    state.settings.locationId = 1819729;
    state.settings.locationAdmin1 = "Hong Kong";
    state.settings.countryCode = "HK";
    state.settings.latitude = 22.3193;
    state.settings.longitude = 114.1694;
    state.settings.timezone = "Asia/Hong_Kong";
  }

  function isHongKongWeatherSelected() {
    return (
      state.settings.countryCode === "HK" ||
      normalizeSearchTerm(state.settings.locationName).indexOf("hong kong") >= 0 ||
      normalizeSearchTerm(state.settings.locationQuery).indexOf("hong kong") >= 0
    );
  }

  function getSavedLocation() {
    return {
      id: state.settings.locationId || null,
      latitude: state.settings.latitude,
      longitude: state.settings.longitude,
      timezone: state.settings.timezone,
      admin1: state.settings.locationAdmin1 || "",
      country_code: state.settings.countryCode || "",
      displayName: state.settings.locationName || state.settings.locationQuery || "Oslo, Norway",
    };
  }

  function defaultWeatherSearchMessage() {
    return state.settings.locationName
      ? isHongKongTheme()
        ? "dei6 dim2 match: " + state.settings.locationName
        : "Resolved place: " + state.settings.locationName
      : isHongKongTheme()
      ? "Open-Meteo jan4 sat6 dei6 dim2 zoek3 sou2. Open-Meteo 真實地點搜索。"
      : "Searches real places from Open-Meteo geocoding.";
  }

  function formatResolvedLocation(location, query) {
    var parts = [location.name];
    if (location.admin1 && location.admin1 !== location.name) {
      parts.push(location.admin1);
    }
    if (location.country) {
      parts.push(location.country);
    }
    return {
      id: location.id || null,
      name: location.name || query || "Selected city",
      admin1: location.admin1 || "",
      country: location.country || "",
      country_code: location.country_code || "",
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || state.settings.timezone || "UTC",
      population: location.population || 0,
      feature_code: location.feature_code || "",
      displayName: parts.filter(Boolean).join(", "),
    };
  }

  function selectBestLocation(query, results) {
    var normalizedQuery = normalizeSearchTerm(query);
    return results
      .slice()
      .sort(function (left, right) {
        var leftScore = locationMatchScore(left, normalizedQuery);
        var rightScore = locationMatchScore(right, normalizedQuery);
        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
        if (featureWeight(left.feature_code) !== featureWeight(right.feature_code)) {
          return featureWeight(right.feature_code) - featureWeight(left.feature_code);
        }
        return (right.population || 0) - (left.population || 0);
      })[0];
  }

  function locationMatchScore(location, normalizedQuery) {
    var displayName = normalizeSearchTerm(location.displayName);
    var name = normalizeSearchTerm(location.name);
    var nameCountry = normalizeSearchTerm([location.name, location.country].filter(Boolean).join(", "));
    var country = normalizeSearchTerm(location.country);
    var admin1 = normalizeSearchTerm(location.admin1);
    var score = 0;

    if (displayName === normalizedQuery) {
      score += 500;
    }
    if (nameCountry === normalizedQuery) {
      score += 360;
    }
    if (name === normalizedQuery) {
      score += 280;
    }
    if (normalizedQuery.indexOf(name) === 0 && name) {
      score += 120;
    }
    if (displayName.indexOf(normalizedQuery) >= 0) {
      score += 80;
    }
    if (country && normalizedQuery.indexOf(country) >= 0) {
      score += 30;
    }
    if (admin1 && normalizedQuery.indexOf(admin1) >= 0) {
      score += 20;
    }

    return score;
  }

  function featureWeight(featureCode) {
    var weights = {
      PPLC: 6,
      PPLA: 5,
      PPLA2: 4,
      PPLA3: 3,
      PPLA4: 2,
      PPL: 1,
      PPLL: 0,
    };
    return weights[featureCode] || 0;
  }

  function normalizeSearchTerm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .trim();
  }

  function openTaskDialog(taskId, draftValues) {
    var task = taskId ? findTask(taskId) : null;
    var initial = task || draftValues || {
      title: "",
      date: ui.selectedDate,
      time: "",
      project: "",
      priority: "medium",
      status: "todo",
      duration: "",
      details: "",
      subtasks: [],
    };

    elements.dialogTitle.textContent = task
      ? isHongKongTheme()
        ? "Goi2 jam6 mou6 改任務"
        : "Edit task"
      : isHongKongTheme()
      ? "Jan1 jam6 mou6 新任務"
      : "New task";
    elements.dialogTaskId.value = task ? task.id : "";
    elements.dialogTaskTitle.value = initial.title || "";
    elements.dialogTaskDate.value = normalizeDate(initial.date) || ui.selectedDate;
    elements.dialogTaskTime.value = initial.time || "";
    elements.dialogTaskProject.value = initial.project || "";
    elements.dialogTaskPriority.value = initial.priority || "medium";
    elements.dialogTaskStatus.value = initial.status || "todo";
    elements.dialogTaskDuration.value = initial.duration || "";
    elements.dialogTaskDetails.value = initial.details || "";
    elements.deleteTaskBtn.hidden = !task;

    elements.subtaskList.innerHTML = "";
    var subtasks = task ? task.subtasks : initial.subtasks || [];
    if (subtasks.length) {
      subtasks.forEach(function (subtask) {
        appendSubtaskRow(subtask);
      });
    } else {
      appendSubtaskRow();
    }

    elements.taskDialog.showModal();
  }

  function closeTaskDialog() {
    elements.taskDialog.close();
  }

  function appendSubtaskRow(subtask) {
    var fragment = elements.subtaskTemplate.content.cloneNode(true);
    var row = fragment.querySelector(".subtask-row");
    var checkbox = row.querySelector(".subtask-row__done");
    var input = row.querySelector(".subtask-row__input");
    checkbox.checked = Boolean(subtask && subtask.done);
    input.value = (subtask && subtask.title) || "";
    elements.subtaskList.appendChild(fragment);
  }

  function saveTaskFromDialog(event) {
    event.preventDefault();
    var title = elements.dialogTaskTitle.value.trim();
    if (!title) {
      elements.dialogTaskTitle.focus();
      return;
    }

    var taskId = elements.dialogTaskId.value;
    var task = taskId ? findTask(taskId) : null;
    var previousStatus = task ? task.status : "todo";
    var nextStatus = elements.dialogTaskStatus.value;
    var subtasks = readSubtasksFromDialog();
    var completedAt = task ? task.completedAt : null;

    if (previousStatus !== "done" && nextStatus === "done") {
      completedAt = new Date().toISOString();
      addCompletionLog(taskId || createId("pending"), title, completedAt);
    }
    if (previousStatus === "done" && nextStatus !== "done" && taskId) {
      completedAt = null;
      removeLatestCompletionLog(taskId);
    }

    var updatedTask = {
      id: task ? task.id : createId("task"),
      title: title,
      date: elements.dialogTaskDate.value || ui.selectedDate,
      time: elements.dialogTaskTime.value,
      project: elements.dialogTaskProject.value.trim(),
      priority: elements.dialogTaskPriority.value,
      status: nextStatus,
      duration: elements.dialogTaskDuration.value.trim(),
      details: elements.dialogTaskDetails.value.trim(),
      subtasks: subtasks,
      createdAt: task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: completedAt,
    };

    if (task) {
      state.tasks = state.tasks.map(function (item) {
        return item.id === task.id ? updatedTask : item;
      });
      if (previousStatus !== "done" && nextStatus === "done") {
        replacePendingCompletionLogId(updatedTask.title, updatedTask.id);
      }
    } else {
      if (nextStatus === "done") {
        replacePendingCompletionLogId(updatedTask.title, updatedTask.id);
      }
      state.tasks.unshift(updatedTask);
    }

    ui.selectedDate = updatedTask.date;
    ui.weekAnchor = startOfWeek(updatedTask.date);
    state.meta.selectedDate = updatedTask.date;
    saveState();
    renderAll();
    closeTaskDialog();
  }

  function readSubtasksFromDialog() {
    return Array.prototype.slice
      .call(elements.subtaskList.querySelectorAll(".subtask-row"))
      .map(function (row) {
        return {
          id: createId("subtask"),
          title: row.querySelector(".subtask-row__input").value.trim(),
          done: row.querySelector(".subtask-row__done").checked,
        };
      })
      .filter(function (subtask) {
        return subtask.title.length > 0;
      });
  }

  function deleteCurrentTask() {
    var taskId = elements.dialogTaskId.value;
    if (!taskId) {
      closeTaskDialog();
      return;
    }
    var task = findTask(taskId);
    if (!task) {
      closeTaskDialog();
      return;
    }
    if (!window.confirm("Delete this task from the dashboard?")) {
      return;
    }
    state.tasks = state.tasks.filter(function (item) {
      return item.id !== taskId;
    });
    removeLatestCompletionLog(taskId);
    saveState();
    renderAll();
    closeTaskDialog();
  }

  function toggleTaskCompletion(taskId, checked) {
    var task = findTask(taskId);
    if (!task) {
      return;
    }
    var nextStatus = checked ? "done" : task.status === "done" ? "todo" : task.status;
    state.tasks = state.tasks.map(function (item) {
      if (item.id !== taskId) {
        return item;
      }
      var updated = Object.assign({}, item, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        completedAt: checked ? new Date().toISOString() : null,
      });
      return updated;
    });
    if (checked) {
      addCompletionLog(taskId, task.title, new Date().toISOString());
    } else {
      removeLatestCompletionLog(taskId);
    }
    saveState();
    renderAll();
  }

  function exportStateAsJson() {
    var payload = JSON.stringify(
      {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        settings: state.settings,
        meta: state.meta,
        tasks: state.tasks,
        activityLog: state.activityLog,
      },
      null,
      2
    );
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "work-dashboard-backup-" + todayIso() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      try {
        var parsed = JSON.parse(loadEvent.target.result);
        validateImportedState(parsed);
        state = {
          settings: normalizeSettings(parsed.settings),
          meta: normalizeMeta(parsed.meta),
          tasks: normalizeTasks(parsed.tasks),
          activityLog: normalizeActivityLog(parsed.activityLog),
        };
        ui.selectedDate = normalizeDate(state.meta.selectedDate) || todayIso();
        ui.weekAnchor = startOfWeek(ui.selectedDate);
        saveState();
        renderAll();
        refreshWeather();
      } catch (error) {
        window.alert("Import failed: " + error.message);
      } finally {
        elements.importFileInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function validateImportedState(parsed) {
    if (!parsed || typeof parsed !== "object") {
      throw new Error("The file does not contain a valid dashboard export.");
    }
    if (!Array.isArray(parsed.tasks)) {
      throw new Error("Missing task list in imported JSON.");
    }
    if (!Array.isArray(parsed.activityLog)) {
      throw new Error("Missing completion history in imported JSON.");
    }
    if (!parsed.settings || typeof parsed.settings !== "object") {
      throw new Error("Missing settings in imported JSON.");
    }
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createInitialState();
      }
      var parsed = JSON.parse(raw);
      return migrateLoadedState({
        settings: normalizeSettings(parsed.settings),
        meta: normalizeMeta(parsed.meta),
        tasks: normalizeTasks(parsed.tasks || []),
        activityLog: normalizeActivityLog(parsed.activityLog || []),
      });
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState() {
    state.meta.lastSavedAt = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncTopbar();
  }

  function createInitialState() {
    var today = todayIso();
    var createdAt = new Date().toISOString();
    return {
      settings: {
        theme: "day",
        locationQuery: "Oslo",
        locationName: "Oslo, Norway",
        locationId: 3143244,
        locationAdmin1: "Oslo County",
        countryCode: "NO",
        latitude: 59.9139,
        longitude: 10.7522,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Oslo",
      },
      meta: {
        createdAt: createdAt,
        lastSavedAt: createdAt,
        selectedDate: today,
      },
      tasks: [],
      activityLog: [],
    };
  }

  function migrateLoadedState(loadedState) {
    if (shouldClearLegacyDemoState(loadedState)) {
      loadedState.tasks = [];
      loadedState.activityLog = [];
      loadedState.meta.selectedDate = todayIso();
    }
    return loadedState;
  }

  function shouldClearLegacyDemoState(loadedState) {
    if (!loadedState || loadedState.tasks.length !== DEMO_TASK_TITLES.length) {
      return false;
    }
    var titles = loadedState.tasks
      .map(function (task) {
        return task.title;
      })
      .sort();
    var demoTitles = DEMO_TASK_TITLES.slice().sort();
    for (var index = 0; index < demoTitles.length; index += 1) {
      if (titles[index] !== demoTitles[index]) {
        return false;
      }
    }
    return true;
  }

  function makeTask(title, date, time, project, priority, status, createdAt, extras) {
    var options = extras || {};
    return {
      id: createId("task"),
      title: title,
      date: date,
      time: time,
      project: project,
      priority: priority,
      status: status,
      duration: options.duration || "",
      details: options.details || "",
      subtasks: normalizeSubtasks(options.subtasks || []),
      createdAt: createdAt,
      updatedAt: createdAt,
      completedAt: options.completedAt || (status === "done" ? new Date().toISOString() : null),
    };
  }

  function makeSubtask(title, done) {
    return { id: createId("subtask"), title: title, done: Boolean(done) };
  }

  function normalizeTasks(tasks) {
    return (tasks || [])
      .map(function (task) {
        return {
          id: task.id || createId("task"),
          title: task.title || "Untitled task",
          date: normalizeDate(task.date) || todayIso(),
          time: task.time || "",
          project: task.project || "",
          priority: ["urgent", "high", "medium", "low"].indexOf(task.priority) >= 0 ? task.priority : "medium",
          status: ["todo", "doing", "done"].indexOf(task.status) >= 0 ? task.status : "todo",
          duration: task.duration || "",
          details: task.details || "",
          subtasks: normalizeSubtasks(task.subtasks || []),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          completedAt: task.completedAt || null,
        };
      })
      .sort(compareTasks);
  }

  function normalizeSubtasks(subtasks) {
    return (subtasks || []).map(function (subtask) {
      return {
        id: subtask.id || createId("subtask"),
        title: subtask.title || "",
        done: Boolean(subtask.done),
      };
    });
  }

  function normalizeMeta(meta) {
    var initialMeta = createInitialState().meta;
    return {
      createdAt: (meta && meta.createdAt) || initialMeta.createdAt,
      lastSavedAt: (meta && meta.lastSavedAt) || initialMeta.lastSavedAt,
      selectedDate: normalizeDate(meta && meta.selectedDate) || initialMeta.selectedDate,
    };
  }

  function normalizeActivityLog(log) {
    return (log || [])
      .filter(function (entry) {
        return entry && entry.completedAt;
      })
      .map(function (entry) {
        return {
          id: entry.id || createId("log"),
          taskId: entry.taskId || createId("history"),
          title: entry.title || "Completed task",
          completedAt: entry.completedAt,
        };
      })
      .sort(function (left, right) {
        return new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime();
      });
  }

  function normalizeSettings(settings) {
    var initialSettings = createInitialState().settings;
    return {
      theme: (settings && settings.theme) || initialSettings.theme,
      locationQuery: (settings && settings.locationQuery) || initialSettings.locationQuery,
      locationName: (settings && settings.locationName) || initialSettings.locationName,
      locationId: settings && settings.locationId ? settings.locationId : initialSettings.locationId,
      locationAdmin1: (settings && settings.locationAdmin1) || initialSettings.locationAdmin1,
      countryCode: (settings && settings.countryCode) || initialSettings.countryCode,
      latitude:
        settings && typeof settings.latitude === "number" ? settings.latitude : initialSettings.latitude,
      longitude:
        settings && typeof settings.longitude === "number" ? settings.longitude : initialSettings.longitude,
      timezone: (settings && settings.timezone) || initialSettings.timezone,
    };
  }

  function transformWeather(payload, location) {
    var current = payload.current || {};
    var hourlyTimes = payload.hourly && payload.hourly.time ? payload.hourly.time : [];
    var hourlyTemps = payload.hourly && payload.hourly.temperature_2m ? payload.hourly.temperature_2m : [];
    var hourlyRain = payload.hourly && payload.hourly.precipitation_probability ? payload.hourly.precipitation_probability : [];
    var forecastDays = payload.daily && payload.daily.time ? payload.daily.time : [];
    var forecastMax = payload.daily && payload.daily.temperature_2m_max ? payload.daily.temperature_2m_max : [];
    var forecastMin = payload.daily && payload.daily.temperature_2m_min ? payload.daily.temperature_2m_min : [];
    var forecastCodes = payload.daily && payload.daily.weather_code ? payload.daily.weather_code : [];
    var locationName =
      (location && location.displayName) || state.settings.locationName || state.settings.locationQuery || "Selected city";
    var nextHourly = [];
    for (var index = 0; index < Math.min(4, hourlyTimes.length); index += 1) {
      nextHourly.push({
        label: formatHourLabel(hourlyTimes[index]),
        tempLabel: Math.round(hourlyTemps[index]) + "\u00B0",
        barWidth: Math.min(100, Math.max(8, Number(hourlyRain[index] || 0))),
      });
    }
    var forecast = [];
    for (var dayIndex = 0; dayIndex < Math.min(4, forecastDays.length); dayIndex += 1) {
      forecast.push({
        day: formatWeekdayShort(forecastDays[dayIndex]),
        condition: weatherCodeToLabel(forecastCodes[dayIndex]),
        range:
          Math.round(forecastMin[dayIndex]) +
          "\u00B0 / " +
          Math.round(forecastMax[dayIndex]) +
          "\u00B0",
      });
    }
    return {
      city: locationName,
      condition: weatherCodeToLabel(current.weather_code),
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature || current.temperature_2m,
      windSpeed: current.wind_speed_10m || 0,
      rainChance: Math.round(hourlyRain[0] || 0),
      timezone: payload.timezone || state.settings.timezone || "Local",
      updatedAt: new Date().toISOString(),
      hourly: nextHourly,
      forecast: forecast,
    };
  }

  function buildSparkline(series) {
    if (!series.length) {
      return "";
    }
    var width = 220;
    var height = 84;
    var max = Math.max.apply(Math, series.concat([1]));
    var points = series
      .map(function (value, index) {
        var x = (index / (series.length - 1 || 1)) * width;
        var y = height - (value / max) * (height - 12) - 6;
        return x + "," + y;
      })
      .join(" ");
    return (
      '<svg class="sparkline-svg" viewBox="0 0 ' +
      width +
      " " +
      height +
      '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(187,111,70,0.28)" />' +
      '<stop offset="100%" stop-color="rgba(187,111,70,0.02)" />' +
      "</linearGradient></defs>" +
      '<polyline fill="none" stroke="rgba(187,111,70,0.85)" stroke-width="3" points="' +
      points +
      '"></polyline>' +
      "</svg>"
    );
  }

  function buildWeatherStat(label, value) {
    return (
      '<div class="weather-stat">' +
      '<span class="weather-stat__label">' +
      escapeHtml(label) +
      "</span>" +
      '<span class="weather-stat__value">' +
      escapeHtml(value) +
      "</span>" +
      "</div>"
    );
  }

  function buildWeatherPlaceholders() {
    return [
      buildWeatherStat(isHongKongTheme() ? "Gam2 gok3 wun1 dou6 體感" : "Feels like", "--"),
      buildWeatherStat(isHongKongTheme() ? "Fung1 lik6 風力" : "Wind", "--"),
      buildWeatherStat(isHongKongTheme() ? "Lok6 jyu5 gei1 wui6 落雨機會" : "Rain chance", "--"),
      buildWeatherStat(isHongKongTheme() ? "Si4 keoi1 時區" : "Timezone", "--"),
    ].join("");
  }

  function addCompletionLog(taskId, title, completedAt) {
    state.activityLog.push({
      id: createId("log"),
      taskId: taskId,
      title: title,
      completedAt: completedAt,
    });
    state.activityLog.sort(function (left, right) {
      return new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime();
    });
  }

  function removeLatestCompletionLog(taskId) {
    var index = -1;
    for (var cursor = state.activityLog.length - 1; cursor >= 0; cursor -= 1) {
      if (state.activityLog[cursor].taskId === taskId) {
        index = cursor;
        break;
      }
    }
    if (index >= 0) {
      state.activityLog.splice(index, 1);
    }
  }

  function replacePendingCompletionLogId(title, taskId) {
    for (var index = state.activityLog.length - 1; index >= 0; index -= 1) {
      if (state.activityLog[index].title === title && state.activityLog[index].taskId.indexOf("pending") === 0) {
        state.activityLog[index].taskId = taskId;
        return;
      }
    }
  }

  function findTask(taskId) {
    return state.tasks.find(function (task) {
      return task.id === taskId;
    });
  }

  function getTasksForDate(date) {
    return state.tasks.filter(function (task) {
      return task.date === date;
    }).sort(compareTasks);
  }

  function countTasksForDate(date) {
    return getTasksForDate(date).length;
  }

  function countPendingTasks() {
    return state.tasks.filter(function (task) {
      return task.status !== "done";
    }).length;
  }

  function countDoingTasks() {
    return state.tasks.filter(function (task) {
      return task.status === "doing";
    }).length;
  }

  function countOpenTasks() {
    return state.tasks.filter(function (task) {
      return task.status !== "done";
    }).length;
  }

  function countOpenSubtasks() {
    return state.tasks.reduce(function (total, task) {
      return (
        total +
        task.subtasks.filter(function (subtask) {
          return !subtask.done;
        }).length
      );
    }, 0);
  }

  function countCompletionsWithinDays(days) {
    var start = startOfDay(addDays(todayIso(), -(days - 1)));
    return state.activityLog.filter(function (entry) {
      return new Date(entry.completedAt) >= start;
    }).length;
  }

  function getFocusQueue() {
    return state.tasks
      .filter(function (task) {
        return task.status !== "done";
      })
      .slice()
      .sort(compareFocusTasks);
  }

  function compareFocusTasks(left, right) {
    var leftRank = focusRank(left);
    var rightRank = focusRank(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return compareTasks(left, right);
  }

  function focusRank(task) {
    if (task.status === "doing") {
      return 0;
    }
    if (task.date === ui.selectedDate) {
      return 1;
    }
    if (task.date === todayIso()) {
      return 2;
    }
    if (task.date < todayIso()) {
      return 3;
    }
    return 4;
  }

  function buildTaskDescriptor(task) {
    var parts = [];
    if (task.project) {
      parts.push(task.project);
    }
    parts.push(priorityLabel(task.priority));
    if (task.subtasks.length) {
      parts.push(
        isHongKongTheme()
          ? task.subtasks.length + " gin6 zi2 jam6 mou6 子任務"
          : task.subtasks.length + " subtasks"
      );
    }
    return parts.join(" \u00B7 ");
  }

  function buildProjectStats() {
    var grouped = {};
    state.tasks.forEach(function (task) {
      var key = task.project || "General";
      grouped[key] = grouped[key] || { name: key, total: 0, open: 0, done: 0 };
      grouped[key].total += 1;
      if (task.status === "done") {
        grouped[key].done += 1;
      } else {
        grouped[key].open += 1;
      }
    });
    return Object.keys(grouped)
      .map(function (key) {
        var project = grouped[key];
        project.progress = Math.round((project.done / project.total) * 100);
        return project;
      })
      .sort(function (left, right) {
        return right.total - left.total;
      });
  }

  function buildHorizonRows(days) {
    var max = 1;
    var rows = [];
    for (var index = 0; index < days; index += 1) {
      var date = addDays(todayIso(), index);
      var count = state.tasks.filter(function (task) {
        return task.date === date && task.status !== "done";
      }).length;
      max = Math.max(max, count);
      rows.push({
        label: formatWeekdayShort(date),
        meta: date.slice(5),
        count: count,
      });
    }
    return rows.map(function (row) {
      row.percent = Math.round((row.count / max) * 100);
      return row;
    });
  }

  function formatTasksInViewCount(count) {
    return isHongKongTheme()
      ? count + " gin6 jam6 mou6 任務檢視中"
      : count + " TASKS IN VIEW";
  }

  function formatVisibleTasksCount(count) {
    return isHongKongTheme()
      ? count + " gin6 jam6 mou6 任務"
      : count + " visible task" + (count === 1 ? "" : "s");
  }

  function summarizeSelectedDay() {
    var tasks = getTasksForDate(ui.selectedDate);
    if (!tasks.length) {
      return isHongKongTheme()
        ? "Mou5 paai4 hou2 ge3 jam6 mou6. 用 quick add 或者匯入 JSON 備份。"
        : "No tasks scheduled. Use the quick-add form or import a saved dashboard JSON.";
    }
    var done = tasks.filter(function (task) {
      return task.status === "done";
    }).length;
    return isHongKongTheme()
      ? done + " gin6 jyun4 sing4 \u00B7 " + (tasks.length - done) + " gin6 mei6 jyun4 sing4"
      : done + " complete \u00B7 " + (tasks.length - done) + " still open";
  }

  function buildFocusLabel() {
    var doing = state.tasks.find(function (task) {
      return task.status === "doing";
    });
    return doing ? doing.title : isHongKongTheme() ? "Mou5 jip3 zung1 焦點未起" : "No active focus";
  }

  function buildCompletionSeries(days) {
    var start = addDays(todayIso(), -(days - 1));
    var counts = [];
    for (var index = 0; index < days; index += 1) {
      var date = addDays(start, index);
      var count = state.activityLog.filter(function (entry) {
        return toLocalDateKey(entry.completedAt) === date;
      }).length;
      counts.push(count);
    }
    return counts;
  }

  function sumNumbers(values) {
    return values.reduce(function (total, value) {
      return total + value;
    }, 0);
  }

  function compareTasks(left, right) {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    if ((left.time || "") !== (right.time || "")) {
      if (!left.time) {
        return 1;
      }
      if (!right.time) {
        return -1;
      }
      return left.time.localeCompare(right.time);
    }
    var priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[left.priority] - priorityOrder[right.priority];
  }

  function buildGreeting(date) {
    var hour = date.getHours();
    if (hour < 12) {
      return isHongKongTheme() ? "Zou2 san4 早晨." : "Good morning.";
    }
    if (hour < 18) {
      return isHongKongTheme() ? "Haa6 ng5 hou2 下晝好." : "Good afternoon.";
    }
    return isHongKongTheme() ? "Maan5 on1 晚安." : "Good evening.";
  }

  function priorityLabel(priority) {
    var labels = isHongKongTheme()
      ? {
          urgent: "Gan2 gip3 緊急",
          high: "Gou1 高",
          medium: "Zung1 中",
          low: "Dai1 低",
        }
      : {
          urgent: "Urgent",
          high: "High",
          medium: "Medium",
          low: "Low",
        };
    return labels[priority] || labels.medium;
  }

  function weatherCodeToLabel(code) {
    return conditionMap[code] || "Weather update";
  }

  function getDisplayLocale() {
    return isHongKongTheme() ? "zh-HK" : undefined;
  }

  function todayIso() {
    return toLocalDateKey(new Date());
  }

  function toLocalDateKey(value) {
    var date = value instanceof Date ? value : new Date(value);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function getBrowserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Oslo";
  }

  function normalizeDate(dateString) {
    if (typeof dateString !== "string" || !ISO_DATE_RE.test(dateString)) {
      return null;
    }
    return dateString;
  }

  function startOfWeek(dateString) {
    var date = new Date(dateString + "T12:00:00");
    var day = date.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
  }

  function addDays(dateString, amount) {
    var date = new Date(dateString + "T12:00:00");
    date.setDate(date.getDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function startOfDay(dateString) {
    return new Date(dateString + "T00:00:00");
  }

  function formatReadableDate(dateString) {
    return new Date(dateString + "T12:00:00").toLocaleDateString(getDisplayLocale(), {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function formatLongDate(date) {
    var formatted = date.toLocaleDateString(getDisplayLocale(), {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return isHongKongTheme() ? formatted : formatted.toUpperCase();
  }

  function formatWeekdayShort(dateString) {
    return new Date(dateString + "T12:00:00").toLocaleDateString(getDisplayLocale(), {
      weekday: "short",
    });
  }

  function formatShortDate(dateString) {
    return new Date(dateString + "T12:00:00").toLocaleDateString(getDisplayLocale(), {
      month: "short",
      day: "numeric",
    });
  }

  function formatHourLabel(dateTimeString) {
    return new Date(dateTimeString).toLocaleTimeString(getDisplayLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatTimeLabel(timeString) {
    return timeString;
  }

  function formatLastSaved(value) {
    if (!value) {
      return isHongKongTheme() ? "mei6 cyun4 未存" : "Not saved";
    }
    return timeAgo(value);
  }

  function timeAgo(value) {
    var diffMs = Date.now() - new Date(value).getTime();
    var diffMinutes = Math.max(0, Math.round(diffMs / 60000));
    if (diffMinutes < 1) {
      return isHongKongTheme() ? "ji1 gaa1 依家" : "just now";
    }
    if (diffMinutes < 60) {
      return isHongKongTheme() ? diffMinutes + " fan1 zung1 cin4 分鐘前" : diffMinutes + "m ago";
    }
    var diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return isHongKongTheme() ? diffHours + " go3 zung1 tau4 cin4 個鐘頭前" : diffHours + "h ago";
    }
    var diffDays = Math.round(diffHours / 24);
    return isHongKongTheme() ? diffDays + " jat6 cin4 日前" : diffDays + "d ago";
  }

  function trimText(value, maxLength) {
    if (value.length <= maxLength) {
      return value;
    }
    return value.slice(0, maxLength - 1).trimEnd() + "\u2026";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createId(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10);
  }

  function assertOk(response) {
    if (!response.ok) {
      throw new Error("Request failed");
    }
    return response;
  }
})();
