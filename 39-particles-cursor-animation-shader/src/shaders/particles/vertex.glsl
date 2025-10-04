uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

void main()
{   
    // Displacement
    vec3 newPosition = position;
    // texture()是一个采样函数，用来从纹理里提取颜色值或数据
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);

    vec3 displacement =vec3(cos(aAngle)*0.2,sin(aAngle)*0.2,1.0);
    displacement = normalize(displacement);
    displacement *= displacementIntensity * 3.0 * aIntensity;
    newPosition += displacement;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Picture
    float pictureIntensity = texture(uPictureTexture, uv).r;

    // Point size
    gl_PointSize = 0.12 * pictureIntensity *uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    // vColor = vec3(pow(pictureIntensity, 2.0));
    vColor = texture(uPictureTexture, uv).rgb * pow(pictureIntensity, 2.0);

}