import EventEmitter from "./EventEmitter.js";

export default class Scroll extends EventEmitter {
  constructor() {
    super();

    // setup
    this.pageHeight = window.innerHeight;
    this.scrollY = 0;
    this.pageIndex = Math.floor(this.scrollY / this.pageHeight);
    this.progress =
      (this.scrollY - this.pageIndex * this.pageHeight) / this.pageHeight;

    // Scroll Event
    window.addEventListener(
      "wheel",
      (event) => {
        this.pageHeight = window.innerHeight;
        this.scrollY = Math.min(
          this.pageHeight * 3,
          Math.max(0, this.scrollY + event.deltaY * 0.5)
        );
        this.pageIndex = Math.floor(this.scrollY / this.pageHeight);
        this.progress =
          (this.scrollY - this.pageIndex * this.pageHeight) / this.pageHeight;
        this.catalogProgress = Math.max(
          0,
          (this.scrollY - this.pageHeight) / this.pageHeight
        );
        this.trigger("scroll");
      },
      { passive: false }
    );
  }
}
