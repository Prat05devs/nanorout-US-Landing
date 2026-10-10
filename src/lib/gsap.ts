import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";

// Registered once, here. Every component imports GSAP from this file.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText);
}

export { gsap, ScrollTrigger, DrawSVGPlugin, SplitText };
