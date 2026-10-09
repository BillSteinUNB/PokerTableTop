import { useLayoutEffect, useRef } from "react";
import { audio } from "./audio.js";
import { captureDealState, planDeal, DEAL_DURATION } from "./dealSequence.js";

// Measure the real card slots so dealing follows every responsive seat layout.
// The temporary flying cards are always backs; only the server-provided card
// underneath is revealed on arrival.
export function useDealAnimation(stageRef, game, connected) {
  const previous = useRef(null);
  const stop = useRef(() => {});

  useLayoutEffect(() => {
    const cancel = () => stop.current();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", cancel);
    motion.addEventListener("change", cancel);
    return () => {
      cancel();
      previous.current = null;
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", cancel);
      motion.removeEventListener("change", cancel);
    };
  }, []);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { ...captureDealState(game), connected };
    if (!connected || before?.connected === false || document.hidden) {
      stop.current();
      return;
    }
    const sequence = planDeal(before, game);
    if (!sequence.length) {
      if (
        before?.handNumber !== game.handNumber ||
        before?.street !== game.street ||
        before?.players.map((player) => player.id).join(",") !==
          game.players.map((player) => player.id).join(",")
      )
        stop.current();
      return;
    }
    stop.current();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      audio.play("deal");
      return;
    }
    const stage = stageRef.current;
    const deck = stage?.querySelector(".deal-deck .playing-card");
    const layer = stage?.querySelector(".deal-layer");
    if (!deck || !layer || !deck.animate) return;

    const animations = new Set();
    const timers = new Set();
    const clones = new Set();
    const soundDelays = [];
    let soundFrame;
    stop.current = () => {
      cancelAnimationFrame(soundFrame);
      timers.forEach(clearTimeout);
      animations.forEach((animation) => animation.cancel());
      clones.forEach((clone) => clone.remove());
      timers.clear();
      animations.clear();
      clones.clear();
    };
    const animate = (element, frames, options, done = () => {}) => {
      const animation = element.animate(frames, options);
      animations.add(animation);
      animation.onfinish = () => {
        done();
        animation.cancel();
        animations.delete(animation);
      };
    };
    const bounds = stage.getBoundingClientRect();
    const source = deck.getBoundingClientRect();
    const slots = new Map(
      [...stage.querySelectorAll("[data-deal-key]")].map((element) => [
        element.dataset.dealKey,
        element,
      ]),
    );
    sequence.forEach(({ key, delay }) => {
      const target = slots.get(key);
      if (!target) return;
      const destination = target.getBoundingClientRect();
      const width = target.offsetWidth;
      const height = target.offsetHeight;
      const resting = getComputedStyle(target).transform;
      const parentTransform = new DOMMatrixReadOnly(
        getComputedStyle(target.parentElement).transform,
      );
      const tilt =
        (Math.atan2(parentTransform.b, parentTransform.a) * 180) / Math.PI;
      const clone = deck.cloneNode(true);
      clone.className = "playing-card back deal-flight";
      clone.removeAttribute("role");
      clone.removeAttribute("aria-label");
      Object.assign(clone.style, {
        left: `${destination.left + destination.width / 2 - width / 2 - bounds.left - stage.clientLeft}px`,
        top: `${destination.top + destination.height / 2 - height / 2 - bounds.top - stage.clientTop}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
      layer.append(clone);
      clones.add(clone);
      const dx =
        source.left +
        source.width / 2 -
        destination.left -
        destination.width / 2;
      const dy =
        source.top +
        source.height / 2 -
        destination.top -
        destination.height / 2;
      const turn = dx > 0 ? -12 : 12;
      const face = target.classList.contains("face");
      const options = { duration: DEAL_DURATION, delay, fill: "both" };
      animate(
        clone,
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(${source.width / width}, ${source.height / height}) rotate(${turn}deg)`,
            opacity: 1,
            offset: 0,
            easing: "cubic-bezier(.18,.72,.28,1)",
          },
          {
            transform: `translate(0, -2px) scale(1.02) rotate(${tilt}deg)`,
            opacity: 1,
            offset: 0.78,
          },
          {
            transform: `translate(0, 0) rotate(${tilt}deg) scaleX(${face ? 0.04 : 1})`,
            opacity: 0,
            offset: 1,
          },
        ],
        options,
        () => {
          clone.remove();
          clones.delete(clone);
        },
      );
      const base = resting === "none" ? "" : resting;
      animate(
        target,
        [
          {
            opacity: 0,
            transform: `${base} scaleX(${face ? 0.04 : 1})`,
            offset: 0,
          },
          {
            opacity: 0,
            transform: `${base} scaleX(${face ? 0.04 : 1})`,
            offset: 0.78,
          },
          { opacity: 1, transform: `${base} scaleX(1)`, offset: 1 },
        ],
        options,
      );
      soundDelays.push(delay);
    });
    // Start all sound timers together after the measured layout is ready,
    // matching the animation frame even on a slower initial table render.
    soundFrame = requestAnimationFrame(() => {
      soundDelays.forEach((delay) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          audio.play("deal");
        }, delay);
        timers.add(timer);
      });
    });
  }, [game, connected, stageRef]);
}
