const StatsView = (function () {
  "use strict";

  let elements = null;

  const charts = {};

  function queryElements() {
    elements = {
      tabContent: DOM.qs("#tab-stats"),
      mediaTypeBtns: DOM.qsa(".stats-media-type-button"),
      mediaTypeContainer: DOM.qs("#media-type-selector"),
      weeklyChart: DOM.qs("#weekly-chart"),
      foldersChart: DOM.qs("#folders-chart"),
      chartTitle: DOM.qs("#weekly-chart-title"),
      activityList: DOM.qs(".stats-activity-list")
    };
  }

  function getElements() {
    return elements;
  }

  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      text: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
      grid: isDark ? "hsl(222, 47%, 15%)" : "hsl(214, 32%, 91%)",
      border: isDark ? "hsl(222, 47%, 20%)" : "hsl(214, 32%, 85%)"
    };
  }

  const templates = {
    activityItem: (activity, index) => `
      <li class="stats-activity-item animate-fade-in-up" style="animation-delay: ${
        0.4 + index * 0.05
      }s">
        <div class="stats-activity-icon-box ${activity.class}">
          ${Icons.getSvg(activity.icon)}
          <span>${activity.execution ?? ""}</span>
        </div>
        <div class="stats-activity-content">
          <div class="stats-activity-content-header">
            <h3>${activity.title}</h3>
            <span class="stats-activity-time">${Utils.formatTimestamp(
              activity.timestamp
            )}</span>
          </div>
          <p>${activity.description}</p>
        </div>
      </li>`,

    activityList: activities =>
      activities
        .slice(0, 5)
        .map((a, i) => templates.activityItem(a, i))
        .join("")
  };

  const render = {
    activityList: activities => {
      elements.activityList.innerHTML = templates.activityList(activities);
    },

    weeklyChart: (data, config) => {
      charts.weekly?.destroy();
      const colors = getThemeColors();
      charts.weekly = new Chart(elements.weeklyChart, {
        type: "bar",
        data: {
          labels: data.weeklyData.map(d => d.day),
          datasets: [
            {
              label: config.LABEL[data.activeMediaType],
              data: data.weeklyData.map(d => d.value),
              backgroundColor: config.COLOR[data.activeMediaType],
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            x: { duration: 0 },
            y: { duration: 1000, easing: "easeOutQuart", from: 0 }
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

    foldersChart: (data, config) => {
      charts.folders?.destroy();
      const colors = getThemeColors();
      const topFolders = data.topFolders.map(({ name, count }, index) => ({
        name,
        count,
        color: config.COLOR_PALETTE[index % config.COLOR_PALETTE.length]
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
            x: { duration: 1500, easing: "easeOutQuart", from: 0 },
            y: { duration: 0 }
          },
          plugins: { legend: { display: false } },
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

    all: (data, config) => {
      update.mediaTypeButtons(data.activeMediaType);
      render.weeklyChart(data, config);
      render.foldersChart(data, config);
      render.activityList(AppState.getActivities());
    }
  };

  const update = {
    mediaTypeButtons: mediaType => {
      elements.mediaTypeBtns.forEach(btn => btn.classList.remove("active"));
      Array.from(elements.mediaTypeBtns)
        .find(btn => btn.dataset.mediaType === mediaType)
        ?.classList.add("active");

      elements.chartTitle.textContent =
        mediaType === "screenshots" ? I18n.t("stats.chart_screenshots") : I18n.t("stats.chart_recordings");
    }
  };

  function init() {
    queryElements();
  }

  function destroyCharts() {
    Object.values(charts).forEach(chart => chart?.destroy());
  }

  return {
    init,
    getElements,
    templates,
    render,
    update,
    destroyCharts
  };
})();
