/*
Copyright(c) 2016 Christopher Joseph Dean Schaefer

This software is provided 'as-is', without any express or implied
warranty.In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions :

1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software.If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

#version 400
#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable

#define D3DSHADE_FLAT 1
#define D3DSHADE_GOURAUD 2
#define D3DSHADE_PHONG 3

#define D3DLIGHT_POINT 1
#define D3DLIGHT_SPOT 2
#define D3DLIGHT_DIRECTIONAL 3

layout(constant_id = 0) const int lightCount = 2;
layout(constant_id = 1) const int shadeMode = D3DSHADE_GOURAUD;
layout(constant_id = 2) const bool isLightingEnabled = true;
layout(constant_id = 3) const int textureCount = 2;

struct Light
{
	int        Type;            /* Type of light source */
	vec4       Diffuse;         /* Diffuse color of light */
	vec4       Specular;        /* Specular color of light */
	vec4       Ambient;         /* Ambient color of light */
	vec3       Position;        /* Position in world space */
	vec3       Direction;       /* Direction in world space */
	float      Range;           /* Cutoff range */
	float      Falloff;         /* Falloff */
	float      Attenuation0;    /* Constant attenuation */
	float      Attenuation1;    /* Linear attenuation */
	float      Attenuation2;    /* Quadratic attenuation */
	float      Theta;           /* Inner angle of spotlight cone */
	float      Phi;             /* Outer angle of spotlight cone */
};
 
struct Material
{
	vec4   Diffuse;        /* Diffuse color RGBA */
	vec4   Ambient;        /* Ambient color RGB */
	vec4   Specular;       /* Specular 'shininess' */
	vec4   Emissive;       /* Emissive color RGB */
	float  Power;          /* Sharpness if specular highlight */
};

layout(binding = 1) uniform MaterialBlock
{
	Material material;
};

layout(binding = 2) uniform LightBlock
{
	Light lights[lightCount];
};

void getPhongLight( int lightIndex, vec3 position1, vec4 norm, out vec4 ambient, out vec4 diffuse, out vec4 spec )
{
	vec3 lightPosition = lights[lightIndex].Position * vec3(1.0,-1.0,1.0);

	vec3 n = normalize( norm.xyz );
	vec3 s = normalize( lightPosition - position1 );
	vec3 v = normalize( -position1 );
	vec3 r = reflect( -s, n );
 
	ambient = lights[lightIndex].Ambient * material.Ambient;
 
	float sDotN = max( dot( s, n ), 0.0 );
	diffuse = lights[lightIndex].Diffuse * material.Diffuse * sDotN;
 
 
	spec = lights[lightIndex].Specular * material.Specular * pow( max( dot(r,v) , 0.0 ), material.Power ); 
}

layout(binding = 0) uniform sampler2D textures[textureCount];

layout (location = 0) in vec4 normal;
layout (location = 1) in vec4 color;
layout (location = 2) in vec2 texcoord1;
layout (location = 3) in vec2 texcoord2;
layout (location = 4) in vec4 pos;

layout (location = 0) out vec4 uFragColor;

void main() 
{
	uFragColor = texture(textures[0], texcoord1.xy) * texture(textures[1], texcoord2.xy) * color;

	if(isLightingEnabled)
	{
		if(shadeMode == D3DSHADE_PHONG)
		{
			vec4 ambientSum = vec4(0);
			vec4 diffuseSum = vec4(0);
			vec4 specSum = vec4(0);
			vec4 ambient, diffuse, spec;

			for( int i=0; i<lightCount; ++i )
			{
				getPhongLight( i, pos.xyz, normal, ambient, diffuse, spec );
				ambientSum += ambient;
				diffuseSum += diffuse;
				specSum += spec;
			}

			ambientSum /= lightCount;

			uFragColor = vec4( ambientSum + diffuseSum) * uFragColor + vec4( specSum);
		}
	}
}