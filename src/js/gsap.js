const breakpoint = 768;
// 関数定義 **********************************************************************
const fadeInUp = () => {
  let fadeInTargets = document.querySelectorAll('.js-fadeInUp');
  fadeInTargets.forEach((target) => {
    gsap.fromTo(target,
      {
        y: 30,
        x: 0,
        autoAlpha: 0,
      },
      {
        y: 0,
        x: 0,
        autoAlpha: 1,
        stagger: 0.1,
        duration: 0.8,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: target,
          start: 'top 90%',
        }
      }
    );
  });
}
const fadeIn = () => {
  let OnlyfadeInTargets = document.querySelectorAll('.js-fadeIn');
  OnlyfadeInTargets.forEach((target) => {
    gsap.fromTo(target,
      {
        autoAlpha: 0,
      },
      {
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: target,
          start: 'top 80%',
        }
      }
    );
  });
}

// 実行 **********************************************************************
document.addEventListener("DOMContentLoaded", function () {
  const mm = gsap.matchMedia();
  // SPの時
  mm.add(`screen and (max-width: ${breakpoint - 1}px)`, () => {
    fadeInUp();
  });
  // PCの時
  mm.add(`screen and (min-width: ${breakpoint}px)`, () => {
    fadeInUp();
  });
});
