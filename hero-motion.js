(function () {
    "use strict";

    var hero = document.querySelector("#home");
    if (!hero) return;

    var band = hero.querySelector(".hero-band");
    var hybrid = hero.querySelector(".hero-hybrid");
    var cards = Array.from(hero.querySelectorAll(".hero-capability[data-capability]"));
    var targets = Array.from(hero.querySelectorAll("[data-merge-target]"));
    var pairs = cards.map(function (card) {
        return {
            card: card,
            target: targets.find(function (target) {
                return target.dataset.mergeTarget === card.dataset.capability;
            }),
            x: 0,
            y: 0
        };
    });
    if (!band || !hybrid || pairs.length !== 6 || pairs.some(function (pair) { return !pair.target; })) return;

    var navbar = document.querySelector(".navbar");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var initialHeight = hero.style.getPropertyValue("height");
    var initialHeightPriority = hero.style.getPropertyPriority("height");
    var heroProperties = [
        "--hero-sticky-top", "--merge-overlay-top", "--merge-scene-opacity",
        "--merge-message-opacity", "--merge-progress"
    ];
    var active = false;
    var start = 0;
    var range = 1;
    var progress = 0;
    var frame = 0;
    var previousTime = 0;
    var needsMeasurement = false;
    var measuredWidth = 0;
    var measuredHeight = 0;

    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function ease(value) {
        var amount = clamp(value);
        return amount * amount * (3 - 2 * amount);
    }

    function viewportHeight() {
        // Small viewport units stay steady when a phone's browser controls retract.
        if (window.CSS && CSS.supports("height", "100svh")) {
            var probe = document.createElement("div");
            probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;width:0;height:100svh;top:0;left:0;";
            document.body.appendChild(probe);
            var height = probe.getBoundingClientRect().height;
            probe.remove();
            if (height > 0) return height;
        }
        return window.innerHeight;
    }

    function restore() {
        active = false;
        previousTime = 0;
        hero.classList.remove("is-merging");
        if (initialHeight) hero.style.setProperty("height", initialHeight, initialHeightPriority);
        else hero.style.removeProperty("height");
        heroProperties.forEach(function (property) { hero.style.removeProperty(property); });
        cards.forEach(function (card) {
            card.style.removeProperty("--merge-card-x");
            card.style.removeProperty("--merge-card-y");
        });
    }

    function render() {
        var movement = ease(progress / 0.8);
        pairs.forEach(function (pair) {
            pair.card.style.setProperty("--merge-card-x", (pair.x * movement).toFixed(2) + "px");
            pair.card.style.setProperty("--merge-card-y", (pair.y * movement).toFixed(2) + "px");
        });
        hero.style.setProperty("--merge-scene-opacity", (1 - ease(progress / 0.24)).toFixed(3));
        hero.style.setProperty("--merge-message-opacity", ease((progress - 0.30) / 0.38).toFixed(3));
        hero.style.setProperty("--merge-progress", progress.toFixed(5));
    }

    function targetProgress() { return clamp((window.scrollY - start) / range); }

    function measure() {
        restore();
        measuredWidth = document.documentElement.clientWidth;
        measuredHeight = viewportHeight();
        if (reducedMotion.matches) return;

        // The empty target slots enter the layout only in the pinned scene.
        hero.classList.add("is-merging");
        var bandHeight = band.getBoundingClientRect().height;
        if (bandHeight <= 0) {
            restore();
            return;
        }
        var navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
        // A tall scene scrolls naturally until its lower section fills the viewport.
        var stickyTop = Math.min(navHeight, measuredHeight - bandHeight);
        hero.style.setProperty("--hero-sticky-top", stickyTop.toFixed(2) + "px");
        hero.style.setProperty("--merge-overlay-top", Math.max(0, navHeight - stickyTop).toFixed(2) + "px");
        range = Math.max(360, Math.min(720, Math.round(measuredHeight * 0.7)));
        hero.style.height = (bandHeight + range).toFixed(2) + "px";
        start = hero.getBoundingClientRect().top + window.scrollY - stickyTop;

        // Both rectangles share the sticky band, so their delta stays valid while scrolling.
        pairs.forEach(function (pair) {
            var source = pair.card.getBoundingClientRect();
            var destination = pair.target.getBoundingClientRect();
            pair.x = destination.left - source.left;
            pair.y = destination.top - source.top;
        });
        active = true;
        progress = targetProgress();
        render();
    }

    function flush(time) {
        frame = 0;
        if (needsMeasurement) {
            needsMeasurement = false;
            measure();
        }
        if (!active) return;

        var target = targetProgress();
        var elapsed = previousTime ? Math.min(64, time - previousTime) : 1000 / 60;
        progress += (target - progress) * (1 - Math.exp(-elapsed / 90));
        if (Math.abs(target - progress) < 0.0005) progress = target;
        render();
        if (progress !== target) {
            previousTime = time;
            frame = window.requestAnimationFrame(flush);
        } else previousTime = 0;
    }

    function schedule(measureAgain) {
        if (measureAgain) needsMeasurement = true;
        if (!frame) frame = window.requestAnimationFrame(flush);
    }

    function recalculate() { schedule(true); }
    window.addEventListener("scroll", function () {
        if (active) schedule(false);
    }, { passive: true });
    window.addEventListener("resize", function () {
        if (Math.abs(document.documentElement.clientWidth - measuredWidth) > 1 ||
            Math.abs(viewportHeight() - measuredHeight) > 1) recalculate();
    }, { passive: true });
    // Responsive rules can change scene geometry even while 100svh stays constant.
    if (window.ResizeObserver) {
        var observedSizes = new WeakMap();
        var geometryObserver = new ResizeObserver(function (entries) {
            var changed = false;
            entries.forEach(function (entry) {
                var previous = observedSizes.get(entry.target);
                var size = entry.contentRect;
                if (previous && (Math.abs(previous.width - size.width) > 0.5 ||
                    Math.abs(previous.height - size.height) > 0.5)) changed = true;
                observedSizes.set(entry.target, { width: size.width, height: size.height });
            });
            if (changed) recalculate();
        });
        [band, hybrid.querySelector(".hero-hybrid-intro"), hybrid.querySelector(".hero-merge-grid")].forEach(function (element) {
            if (element) geometryObserver.observe(element);
        });
    }
    window.addEventListener("load", recalculate, { once: true });
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", recalculate);
    else reducedMotion.addListener(recalculate);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalculate);

    recalculate();
})();
