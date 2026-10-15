(function () {
    "use strict";

    var hero = document.querySelector("#home");
    if (!hero) return;

    var band = hero.querySelector(".hero-band");
    var hybrid = hero.querySelector(".hero-hybrid");
    var copies = Array.from(hero.querySelectorAll(".hero-capability-set"));
    if (!band || !hybrid || copies.length !== 2) return;

    var navbar = document.querySelector(".navbar");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var initialHeight = hero.style.getPropertyValue("height");
    var initialHeightPriority = hero.style.getPropertyPriority("height");
    var heroProperties = [
        "--hero-sticky-top", "--merge-copy-opacity",
        "--merge-scene-opacity", "--merge-message-opacity", "--merge-message-y"
    ];
    var active = false;
    var start = 0;
    var range = 1;
    var distances = [];
    var frame = 0;
    var needsMeasurement = false;

    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function ease(value) {
        var progress = clamp(value);
        return progress * progress * (3 - 2 * progress);
    }

    function restore() {
        active = false;
        hero.classList.remove("is-merging");
        if (initialHeight) hero.style.setProperty("height", initialHeight, initialHeightPriority);
        else hero.style.removeProperty("height");
        heroProperties.forEach(function (property) { hero.style.removeProperty(property); });
        copies.forEach(function (copy) {
            copy.style.removeProperty("--merge-x");
            copy.style.removeProperty("--merge-y");
        });
    }

    function render() {
        if (!active) return;
        var progress = clamp((window.scrollY - start) / range);
        var movement = ease(progress / 0.65);

        copies.forEach(function (copy, index) {
            copy.style.setProperty("--merge-x", (distances[index] * movement).toFixed(2) + "px");
            copy.style.setProperty("--merge-y", (32 * movement).toFixed(2) + "px");
        });
        hero.style.setProperty("--merge-copy-opacity", (1 - ease((progress - 0.3) / 0.35)).toFixed(3));
        hero.style.setProperty("--merge-scene-opacity", (1 - ease(progress / 0.4)).toFixed(3));
        hero.style.setProperty("--merge-message-opacity", ease((progress - 0.45) / 0.35).toFixed(3));
        hero.style.setProperty("--merge-message-y", (-140 * (1 - ease((progress - 0.65) / 0.25))).toFixed(2) + "px");
    }

    function measure() {
        restore();
        if (reducedMotion.matches || window.innerWidth < 1000) return;

        var stickyTop = navbar ? navbar.getBoundingClientRect().height : 0;
        hero.style.setProperty("--hero-sticky-top", stickyTop.toFixed(2) + "px");

        // Measure the scene with the narrative out of flow, as it will be pinned.
        hero.classList.add("is-merging");
        var bandHeight = band.getBoundingClientRect().height;
        var availableHeight = window.innerHeight - stickyTop;
        if (bandHeight <= 0 || bandHeight > availableHeight + 12) {
            restore();
            return;
        }

        range = Math.max(420, Math.round(window.innerHeight * 0.6));
        hero.style.height = (bandHeight + range).toFixed(2) + "px";
        start = hero.getBoundingClientRect().top + window.scrollY - stickyTop;
        var center = document.documentElement.clientWidth / 2;
        distances = copies.map(function (copy) {
            var bounds = copy.getBoundingClientRect();
            return (center - (bounds.left + bounds.width / 2));
        });
        active = true;
        render();
    }

    function flush() {
        frame = 0;
        if (needsMeasurement) {
            needsMeasurement = false;
            measure();
        } else render();
    }

    function schedule(measureAgain) {
        if (measureAgain) needsMeasurement = true;
        if (!frame) frame = window.requestAnimationFrame(flush);
    }

    function recalculate() { schedule(true); }
    window.addEventListener("scroll", function () {
        if (active) schedule(false);
    }, { passive: true });
    window.addEventListener("resize", recalculate, { passive: true });
    window.addEventListener("load", recalculate, { once: true });
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", recalculate);
    else reducedMotion.addListener(recalculate);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalculate);

    recalculate();
})();
