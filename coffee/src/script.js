import "./style.css";
import Experience from "./Experience/Experience.js";

const landingPage = document.querySelector(".landing-container-scroll");
const canvas = document.querySelector("canvas.webgl");

const origin = document.getElementById("origin");
const roasting = document.getElementById("roasting");
const brewing = document.getElementById("brewing");
const milk = document.getElementById("milk");
const back = document.getElementById("back");
const line = document.getElementById("line");
const catalogs = [origin, roasting, brewing, milk];

const experiernce = new Experience(canvas, landingPage, catalogs, back, line);

// window.addEventListener("load", () => {
//   gsap.to("#guide-line", {
//     duration: 1.5,
//     attr: { x2: 75, y2: 25 },
//     strokeDashoffset: 0,
//     ease: "power2.out",
//   });

//   gsap.to("#label", {
//     duration: 0.8,
//     opacity: 1,
//     delay: 1.5,
//     ease: "power1.inOut",
//   });
// });
