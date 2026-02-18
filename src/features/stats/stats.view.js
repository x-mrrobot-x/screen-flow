const StatsView = (function () {
  "use strict";

  let container = null;
  const elements = {};
  const charts = {};

  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      text: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
      grid: isDark ? "hsl(222, 47%, 15%)" : "hsl(214, 32%, 91%)",
      border: isDark ? "hsl(222, 47%, 20%)" : "hsl(214, 32%, 85%)"
    };
  }

  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0)
      return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} atrás`;
    if (diffHours > 0)
      return `${diffHours} ${diffHours === 1 ? "hora" : "horas"} atrás`;
    if (diffMins > 0)
      return `${diffMins} ${diffMins === 1 ? "minuto" : "minutos"} atrás`;
    return "Agora mesmo";
  }

  const templates = {
    activityItem: (activity, index) => `
      <li class="activity-item animate-fade-in-up" style="animation-delay: ${
        0.4 + index * 0.05
      }s">
        <div class="icon-box ${activity.class}">
          ${Icons.getSvg(activity.icon)}
          <span>${activity.execution ? activity.execution : ""}</span>
        </div>
          
        <div class="item-content">
          <div class="item-header">
            <h3>${activity.title}</h3>
            <span class="item-time">${formatTimeAgo(activity.timestamp)}</span>
          </div>
          <p>${activity.description}</p>
        </div>
      </li>`,
    activityList: activities =>
      activities
        .slice(0, 5)
        .map((a, i) => templates.activityItem(a, i))
        .join(""),
    activityCard: activities => `
      <article class="activity-card animate-fade-in-up" style="animation-delay: 0.4s">
        <div class="card-header">
          <div class="header-icon">${Icons.getSvg("calendar")}</div>
          <h2 class="card-title">Atividade Recente</h2>
        </div>
        <ul class="activity-list">${templates.activityList(activities)}</ul>
      </article>`
  };

  const render = {
    activityCard: activities => {
      const card = DOM.qs(StatsConfig.SELECTORS.activityCard);
      if (card) {
        const list = DOM.qs(StatsConfig.SELECTORS.activityList, card);
        if (list) list.innerHTML = templates.activityList(activities);
      }
    },
    weeklyChart: data => {
      if (charts.weekly) {
        charts.weekly.destroy();
      }
      const colors = getThemeColors();
      charts.weekly = new Chart(elements.weeklyChart, {
        type: "bar",
        data: {
          labels: data.weeklyData.map(d => d.day),
          datasets: [
            {
              label: StatsConfig.CHART_LABEL[data.activeMediaType],
              data: data.weeklyData.map(d => d.value),
              backgroundColor: StatsConfig.CHART_COLOR[data.activeMediaType],
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            x: { duration: 0 },
            y: {
              duration: 1000,
              easing: "easeOutQuart",
              from: 0
            }
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: { color: colors.text }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: colors.text, font: { size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 11 } }
            }
          }
        }
      });
    },
    foldersChart: data => {
      if (charts.folders) {
        charts.folders.destroy();
      }
      const colors = getThemeColors();
      const topFolders = data.topFolders.map(({ name, count }, index) => ({
        name,
        count,
        color:
          StatsConfig.COLOR_PALETTE[index % StatsConfig.COLOR_PALETTE.length]
      }));
      charts.folders = new Chart(elements.foldersChart, {
        type: "bar",
        data: {
          labels: topFolders.map(f => f.name),
          datasets: [
            {
              data: topFolders.map(f => f.count),
              backgroundColor: topFolders.map(f => f.color),
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 4,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.5
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            x: {
              duration: 1500,
              easing: "easeOutQuart",
              from: 0
            },
            y: { duration: 0 }
          },
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { display: false },
              ticks: { color: colors.text, font: { size: 11 } }
            },
            y: {
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 11 } }
            }
          }
        }
      });
    },
    mediaTypeUI: mediaType => {
      elements.mediaTypeButtons.forEach(btn => btn.classList.remove("active"));
      const activeButton = Array.from(elements.mediaTypeButtons).find(
        btn => btn.dataset.mediaType === mediaType
      );
      if (activeButton) activeButton.classList.add("active");
      const title = DOM.qs(StatsConfig.SELECTORS.weeklyChartTitle);
      if (title)
        title.textContent =
          mediaType === "screenshots"
            ? "Capturas por Dia"
            : "Gravações por Dia";
    },
    complete: data => {
      render.mediaTypeUI(data.activeMediaType);
      render.weeklyChart(data);
      render.foldersChart(data);
      const activities = AppState.getActivities();
      render.activityCard(activities);
    }
  };

  function init(containerSelector) {
    container = DOM.qs(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in StatsConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        elements[key] = DOM.qsa(StatsConfig.SELECTORS[key]);
        if (elements[key].length === 1) elements[key] = elements[key][0];
      }
    }
    return container;
  }

  function update(section, data) {
    if (render[section]) render[section](data);
  }

  function clear() {
    for (const chart in charts) {
      charts[chart].destroy();
    }
    if (container) container.innerHTML = "";
  }

  return {
    init,
    render,
    update,
    clear
  };
})();
