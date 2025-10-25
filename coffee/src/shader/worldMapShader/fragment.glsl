uniform vec3 uCenter;

varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vPosition - uCenter);
    vec3 color = vec3(1.0);

    // Alpha
    float edgeAlpha = dot(viewDirection, normal);
    if(edgeAlpha > 0.0){
        color = vec3(0.0);
    }

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
} 