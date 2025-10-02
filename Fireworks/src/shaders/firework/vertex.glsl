uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;
attribute float aTimeMultiplier;

float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax)
{
    return destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin);
}

void main()
{   
    float progress = uProgress;
    vec3 newPosition = position;

    // Launching
    float launchingProgress = remap(progress, 0.0, 0.3, -1.5 + aSize*0.45, 0.0+ aSize*0.45);
    launchingProgress = clamp(launchingProgress, -1.0, 0.0);

    // Exploding
    float explodingProgress = remap(progress, 0.3, 0.4, 0.0, 1.0);
    explodingProgress = clamp(explodingProgress, 0.0, 1.0);
    explodingProgress = 1.0 - pow(1.0-explodingProgress, 1.5);

    // Ongoing
    float ongoingProgress = remap(progress, 0.35, 1.0, 1.0, 1.3);
    ongoingProgress = clamp(ongoingProgress, 1.0, 1.3);

    newPosition = newPosition * explodingProgress;
    newPosition = newPosition * ongoingProgress;
    newPosition.y += launchingProgress;

    // Falling
    float fallingProgress = remap(progress, 0.4, 1.0, 0.0, 1.0);
    fallingProgress = clamp(fallingProgress, 0.0, 1.0);
    newPosition.y -= fallingProgress * 0.2;

    // Scaling
    float sizeOpeningProgress = remap(progress, 0.0, 0.125, 0.0, 1.0);
    float sizeClosingProgress = remap(progress, 0.125, 1.0, 1.0, 0.0);
    float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
    sizeProgress = clamp(sizeProgress, 0.0, 1.0);

    // Twinkling
    float twinklingProgress = remap(progress, 0.2, 0.8, 0.0, 1.0);
    twinklingProgress = clamp(twinklingProgress, 0.0, 1.0);
    float sizeTwinkling = sin(progress*aTimeMultiplier*30.0)*0.5 + 0.5;
    sizeTwinkling = 1.0 - (sizeTwinkling * twinklingProgress);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Final size
    gl_PointSize = aSize * uSize * uResolution.y * sizeProgress * sizeTwinkling;
    gl_PointSize *= (1.0 / -viewPosition.z); // Perspective

    if(gl_PointSize < 1.0)
        gl_Position = vec4(9999.9);
}