/* =====================================================================
   NourEddin Abu-Salhieh — Portfolio interactions
   Vanilla JS, no dependencies.
   ===================================================================== */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- 1. Theme (shared across all pages) ---------- */

    var root = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        try { localStorage.setItem("theme", theme); } catch (e) { /* private mode */ }

        var btn = document.querySelector(".theme-switch");
        if (btn) {
            btn.setAttribute("aria-pressed", theme === "dark");
            btn.setAttribute("aria-label",
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
        }
    }

    document.addEventListener("click", function (e) {
        var btn = e.target.closest(".theme-switch");
        if (!btn) return;
        applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });

    applyTheme(root.getAttribute("data-theme") || "light");


    /* ---------- 2. Scroll progress + sticky nav state ---------- */

    var bar = document.querySelector(".progress-bar");
    var navbar = document.querySelector(".navbar");
    var toTop = document.querySelector(".to-top");
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;

        if (bar) bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
        if (navbar) navbar.classList.toggle("scrolled", y > 12);
        if (toTop) toTop.classList.toggle("show", y > 500);

        ticking = false;
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });

    onScroll();

    if (toTop) {
        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }


    /* ---------- 3. Mobile menu ---------- */

    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");

    if (toggle && links) {
        toggle.addEventListener("click", function () {
            var open = links.classList.toggle("open");
            toggle.setAttribute("aria-expanded", open);
        });

        links.addEventListener("click", function (e) {
            if (e.target.tagName === "A") {
                links.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });
    }


    /* ---------- 4. Scroll reveal (stagger per group) ---------- */

    var reveals = document.querySelectorAll(".reveal");

    // stagger siblings inside the same card grid / list
    document.querySelectorAll(".cards, .contact-list, .chips, .timeline, .meters")
        .forEach(function (group) {
            group.querySelectorAll(":scope > .reveal").forEach(function (el, i) {
                el.style.setProperty("--d", (i * 90) + "ms");
            });
        });

    if (!("IntersectionObserver" in window) || reduceMotion) {
        reveals.forEach(function (el) { el.classList.add("in"); });
        fillMeters(document);
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("in");
                fillMeters(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

        reveals.forEach(function (el) { io.observe(el); });
    }

    function fillMeters(scope) {
        var fills = scope.querySelectorAll
            ? scope.querySelectorAll(".meter-fill")
            : [];
        fills.forEach(function (f) {
            f.style.width = (f.dataset.value || 0) + "%";
        });
    }


    /* ---------- 5. Count-up stats ---------- */

    var counters = document.querySelectorAll("[data-count]");

    function runCounter(el) {
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || "";
        var dur = 1500;
        var start = performance.now();

        if (reduceMotion) {
            el.textContent = target + suffix;
            return;
        }

        function step(now) {
            var p = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    if ("IntersectionObserver" in window) {
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                runCounter(entry.target);
                cio.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        counters.forEach(function (el) { cio.observe(el); });
    } else {
        counters.forEach(runCounter);
    }


    /* ---------- 6. Active nav link on scroll ---------- */

    var sections = document.querySelectorAll("main section[id], main footer[id]");
    var navAnchors = document.querySelectorAll(".nav-links a");

    if (sections.length && "IntersectionObserver" in window) {
        var sio = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = entry.target.id;
                navAnchors.forEach(function (a) {
                    var href = a.getAttribute("href") || "";
                    a.classList.toggle("active", href.endsWith("#" + id));
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        sections.forEach(function (s) { sio.observe(s); });
    }


    /* ---------- 7. Card cursor spotlight ---------- */

    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll(".card").forEach(function (card) {
            card.addEventListener("pointermove", function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty("--mx", (e.clientX - r.left) + "px");
                card.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }


    /* ---------- 8. Magnetic buttons ---------- */

    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll(".button, .to-top").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left - r.width / 2) * 0.22;
                var y = (e.clientY - r.top - r.height / 2) * 0.34;
                el.style.transform = "translate(" + x + "px," + (y - 2) + "px)";
            });

            el.addEventListener("pointerleave", function () {
                el.style.transform = "";
            });
        });
    }


    /* ---------- 9. Hero: per-letter entrance ---------- */

    document.querySelectorAll("[data-split]").forEach(function (el) {
        var offset = parseInt(el.dataset.split, 10) || 0;
        var text = el.textContent;
        el.textContent = "";

        text.split("").forEach(function (ch, i) {
            var s = document.createElement("span");
            s.className = "ltr";
            s.textContent = ch === " " ? " " : ch;
            s.style.animationDelay = (200 + (offset + i) * 42) + "ms";
            el.appendChild(s);
        });
    });


    /* ---------- 10. Hero: typewriter ---------- */

    var typed = document.querySelector("[data-typed]");

    if (typed) {
        var words;
        try {
            words = JSON.parse(typed.dataset.typed);
        } catch (e) {
            words = [typed.dataset.typed];
        }

        if (reduceMotion) {
            typed.textContent = words[0];
        } else {
            var wi = 0, ci = 0, deleting = false;

            (function type() {
                var word = words[wi];
                ci += deleting ? -1 : 1;
                typed.textContent = word.slice(0, ci);

                var wait = deleting ? 45 : 85;

                if (!deleting && ci === word.length) {
                    deleting = true;
                    wait = 1900;
                } else if (deleting && ci === 0) {
                    deleting = false;
                    wi = (wi + 1) % words.length;
                    wait = 380;
                }

                setTimeout(type, wait);
            })();
        }
    }


    /* ---------- 11. Optional artwork ---------- */

    // A card may name an export that has not been added yet. The image starts
    // transparent and only reveals once it has really decoded, so a missing
    // file shows the drawn artboards instead of a broken-image box.
    document.querySelectorAll("img[data-optional]").forEach(function (img) {
        function reveal() {
            if (img.naturalWidth > 0) img.classList.add("is-ready");
            else img.remove();
        }

        img.addEventListener("load", reveal);
        img.addEventListener("error", function () { img.remove(); });
        if (img.complete) reveal();
    });


    /* ---------- 11. Reveal cards ---------- */

    // With a mouse the sleeve rides hover; on a touch screen a tap opens it and
    // a second tap closes it. Taps on links pass straight through so the sleeve
    // never swallows a "View certificate". Enter/Space works on any device.
    var touchOnly = window.matchMedia("(hover: none)").matches;

    document.querySelectorAll(".rev-card").forEach(function (card) {
        if (touchOnly) {
            card.addEventListener("click", function (e) {
                if (e.target.closest("a")) return;
                card.classList.toggle("is-open");
            });
        }

        card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.classList.toggle("is-open");
            }
            if (e.key === "Escape") card.classList.remove("is-open");
        });
    });


    /* ---------- 12. Marquee: duplicate track for a seamless loop ---------- */

    document.querySelectorAll(".marquee-track").forEach(function (track) {
        track.innerHTML += track.innerHTML;
    });

})();
