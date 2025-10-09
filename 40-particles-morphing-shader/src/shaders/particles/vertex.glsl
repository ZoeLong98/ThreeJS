#include ../includes/simplexNoise3d.glsl

uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;

attribute vec3 aTargetPosition;
attribute float aSize;

varying vec3 vColor;

void main()
{   
    // Mixed Position
    float noiseOrigin = simplexNoise3d(position*0.8);
    float noiseTarget = simplexNoise3d(aTargetPosition*0.8);
    float noise = mix(noiseOrigin, noiseTarget, uProgress);
    noise = smoothstep(-1.0, 1.0, noise); // smoothstep 函数将噪声值映射到 0 到 1 之间
    float duration = 0.4;
    float delay = (1.0-duration) * noise;
    float end = delay + duration;

    float progress = smoothstep(delay, end, uProgress);
    vec3 mixedPosition = mix(position, aTargetPosition, progress);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    vColor = mix(uColorA, uColorB, noise);
    // Point size
    gl_PointSize = aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}