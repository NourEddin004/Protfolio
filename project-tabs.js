(function () {
    "use strict";

    var projects = document.querySelector("#projects");
    if (!projects) return;

    var tablist = projects.querySelector(".project-tabs");
    var tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    var results = projects.querySelector("#project-results");
    var panels = Array.from(results.querySelectorAll(".project-panel"));

    function selectTab(index, moveFocus) {
        tabs.forEach(function (tab, i) {
            var selected = i === index;
            tab.setAttribute("aria-selected", selected ? "true" : "false");
            tab.tabIndex = selected ? 0 : -1;
        });
        var activeTab = tabs[index];
        var category = activeTab.dataset.category;
        results.classList.toggle("project-results--all", category === "all");
        panels.forEach(function (panel) {
            panel.hidden = category !== "all" && panel.id !== "project-panel-" + category;
        });
        results.setAttribute("aria-labelledby", activeTab.id);
        if (moveFocus) activeTab.focus();
    }

    tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () { selectTab(index, false); });
        tab.addEventListener("keydown", function (event) {
            var next;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            selectTab(next, true);
        });
    });

    // Keep existing links to a project category working.
    function selectFromHash() {
        var category = window.location.hash.slice(1);
        if (category === "projects") category = "all";
        var index = tabs.findIndex(function (tab) { return tab.dataset.category === category; });
        if (index === -1) return;
        selectTab(index, false);
        requestAnimationFrame(function () { projects.scrollIntoView({ block: "start" }); });
    }

    selectTab(0, false);
    tablist.hidden = false;
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
})();
