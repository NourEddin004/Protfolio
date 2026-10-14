(function () {
    "use strict";

    var projects = document.querySelector("#projects");
    if (!projects) return;

    var tablist = projects.querySelector(".project-tabs");
    var tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function selectTab(index, moveFocus) {
        tabs.forEach(function (tab, i) {
            var selected = i === index;
            tab.setAttribute("aria-selected", selected ? "true" : "false");
            tab.tabIndex = selected ? 0 : -1;
            panels[i].hidden = !selected;
        });
        if (moveFocus) tabs[index].focus();
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
        var index = ["#apps", "#web", "#figma"].indexOf(window.location.hash);
        if (index === -1) return;
        selectTab(index, false);
        requestAnimationFrame(function () { projects.scrollIntoView({ block: "start" }); });
    }

    selectTab(0, false);
    tablist.hidden = false;
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
})();
