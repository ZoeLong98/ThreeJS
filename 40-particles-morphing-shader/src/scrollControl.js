import * as THREE from "three";

/**
 * 初始化滚动控制系统
 * @param {Object} params 依赖对象（scrollControl, particles, camera, controls, models）
 */
export function initScrollControl({
  scrollControl,
  particles,
  camera,
  controls,
  models,
}) {
  // 触摸相关变量
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTouch = false;
  function scrollChange() {
    if (
      particles.index === 0 &&
      scrollControl.targetValue < scrollControl.min
    ) {
      // 在0号模型时，不允许向下滚动超过min
      scrollControl.targetValue = scrollControl.min;
    } else if (
      particles.index === models.length - 2 &&
      scrollControl.targetValue > scrollControl.max
    ) {
      // 在最后第二个模型时，不允许向上滚动超过max
      scrollControl.targetValue = scrollControl.max;
    } else {
      // 中间模型的循环处理
      if (
        scrollControl.targetValue > scrollControl.max &&
        particles.index < models.length - 2
      ) {
        scrollControl.targetValue =
          scrollControl.min + (scrollControl.targetValue - scrollControl.max);
      } else if (
        scrollControl.targetValue < scrollControl.min &&
        particles.index > 0
      ) {
        scrollControl.targetValue =
          scrollControl.max + (scrollControl.targetValue - scrollControl.min);
      }
    }
  }
  // 滚动监听
  window.addEventListener("wheel", (event) => {
    scrollControl.targetValue += event.deltaY * scrollControl.sensitivity;
    scrollChange();
  });

  // 触摸开始事件
  window.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();
        isTouch = true;
      }
    },
    { passive: false }
  );

  // 触摸移动事件
  window.addEventListener(
    "touchmove",
    (event) => {
      if (isTouch && event.touches.length === 1) {
        const currentY = event.touches[0].clientY;
        const deltaY = touchStartY - currentY; // 向上滑动为正值，向下滑动为负值

        // 调整敏感度，触摸滑动通常需要更高的敏感度
        const touchSensitivity = scrollControl.sensitivity * 5;
        scrollControl.targetValue += deltaY * touchSensitivity;

        // 应用相同的边界限制逻辑
        scrollChange();

        // 更新起始位置，实现连续滑动
        touchStartY = currentY;
      }
    },
    { passive: false }
  );

  // 触摸结束事件
  window.addEventListener("touchend", (event) => {
    if (isTouch) {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      // 如果触摸时间很短且移动距离大，可以添加惯性效果
      if (touchDuration < 200 && event.changedTouches.length === 1) {
        const endY = event.changedTouches[0].clientY;
        const totalDelta = touchStartY - endY;

        // 添加额外的惯性滚动
        if (Math.abs(totalDelta) > 50) {
          const inertia = totalDelta * 0.3;
          const inertiaSensitivity = scrollControl.sensitivity * 5;
          scrollControl.targetValue += inertia * inertiaSensitivity;

          // 再次应用边界限制
          if (
            particles.index === 0 &&
            scrollControl.targetValue < scrollControl.min
          ) {
            scrollControl.targetValue = scrollControl.min;
          } else if (
            particles.index === models.length - 2 &&
            scrollControl.targetValue > scrollControl.max
          ) {
            scrollControl.targetValue = scrollControl.max;
          }
        }
      }

      isTouch = false;
      touchStartY = 0;
      touchStartTime = 0;
    }
  });

  // 取消触摸事件（用户在触摸过程中被打断）
  window.addEventListener("touchcancel", (event) => {
    isTouch = false;
    touchStartY = 0;
    touchStartTime = 0;
  });

  let previous = 0;
  let currentIndex = 0;
  let nextIndex = 1;
  // 平滑更新函数
  function updateScrollValue() {
    let diff = scrollControl.targetValue - scrollControl.value;

    if (Math.abs(diff) > scrollControl.range / 2) {
      diff += diff > 0 ? -scrollControl.range : scrollControl.range;
    }

    scrollControl.value += diff * scrollControl.smoothness;
    particles.material.uniforms.uProgress.value = Math.max(
      Math.min(scrollControl.value, 1),
      0
    );

    if (scrollControl.value > scrollControl.max) {
      particles.index = Math.min(
        Math.max(particles.index + 1, 0),
        models.length - 2
      );
      scrollControl.value =
        scrollControl.min + (scrollControl.value - scrollControl.max);
      // 重置progress确保平滑过渡
      particles.material.uniforms.uProgress.value = 0;
    } else if (scrollControl.value < scrollControl.min) {
      particles.index = Math.max(particles.index - 1, 0);
      scrollControl.value =
        scrollControl.max + (scrollControl.value - scrollControl.min);
      // 重置progress确保平滑过渡
      particles.material.uniforms.uProgress.value = 1;
    }

    if (particles.index != previous) {
      currentIndex = particles.index;
      nextIndex = Math.min(Math.max(particles.index + 1, 1), models.length - 1);

      // 更新几何体属性并标记需要更新
      particles.geometry.attributes.position =
        particles.positions[particles.index];
      particles.geometry.attributes.aTargetPosition =
        particles.positions[nextIndex];

      // 通知GPU这些属性需要重新上传
      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.aTargetPosition.needsUpdate = true;

      previous = particles.index;
    }

    // 相机插值部分
    if (particles.cameraInfo?.length > 0) {
      const currentInfo = particles.cameraInfo[Math.max(particles.index, 0)];
      const nextInfo = particles.cameraInfo[nextIndex];

      if (currentInfo && nextInfo) {
        const currentDir = new THREE.Vector3(
          ...particles.normals[currentIndex]
        );
        const nextDir = new THREE.Vector3(...particles.normals[nextIndex]);

        const currentPos = currentInfo.center
          .clone()
          .add(currentDir.clone().multiplyScalar(currentInfo.optimalDistance));
        const nextPos = nextInfo.center
          .clone()
          .add(nextDir.clone().multiplyScalar(nextInfo.optimalDistance));

        const sectionProgress = Math.min(Math.max(scrollControl.value, 0), 1);
        const lerpedPos = currentPos.lerp(nextPos, sectionProgress);
        const lerpedTarget = currentInfo.center
          .clone()
          .lerp(nextInfo.center, sectionProgress);

        camera.position.lerp(lerpedPos, 0.05);
        controls.target.lerp(lerpedTarget, 0.05);
      }
    }
  }

  // 暴露一个更新函数给外部使用
  return { updateScrollValue };
}
