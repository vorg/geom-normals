import normals from "../index.js";
import { plane } from "primitive-geometry";
import oldPlane from "primitive-plane";

import createContext from "pex-context";
import { avec3, vec3, mat4 } from "pex-math";
import random from "pex-random";
import createGUI from "pex-gui";

random.seed(0);

const basicVert = /* glsl */ `#version 300 es
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

in vec3 aPosition;
in vec3 aNormal;

out vec3 vNormal;
out vec4 vColor;
out vec3 vPositionWorld;

void main () {
  vNormal = aNormal;
  vColor = vec4(aNormal * 0.5 + 0.5, 1.0);

  vPositionWorld = (uModelMatrix * vec4(aPosition, 1.0)).xyz;

  gl_Position = uProjectionMatrix * uViewMatrix * vec4(vPositionWorld, 1.0);
}`;
const basicFrag = /* glsl */ `#version 300 es
precision highp float;

uniform float uMode;

in vec3 vNormal;
in vec4 vColor;
in vec3 vPositionWorld;

out vec4 fragColor;

const float gamma = 2.2;
vec3 toLinear(vec3 v) {
  return pow(v, vec3(gamma));
}
vec3 toGamma(vec3 v) {
  return pow(v, vec3(1.0 / gamma));
}

void main() {
  if (uMode == 0.0) fragColor = vColor;

  if (uMode == 1.0) {
    vec3 ambientColor = vec3(0.1, 0.1, 0.1);
    vec3 lightPos = vec3(1.0, -1.0, 1.0);
    float uWrap = 0.1;

    vec3 L = normalize(lightPos);
    vec3 N = normalize(vNormal);
    float NdotL = max(0.0, (dot(N, L) + uWrap) / (1.0 + uWrap));
    vec3 ambient = toLinear(ambientColor.rgb);
    vec3 diffuse = toLinear(vColor.rgb);

    fragColor = vec4(toGamma(ambient + NdotL * diffuse), 1.0);
  }

  if (uMode == 2.0) {
    vec3 fdx = vec3(dFdx(vPositionWorld.x), dFdx(vPositionWorld.y), dFdx(vPositionWorld.z));
    vec3 fdy = vec3(dFdy(vPositionWorld.x), dFdy(vPositionWorld.y), dFdy(vPositionWorld.z));
    vec3 normal = normalize(cross(fdx, fdy));
    fragColor = vec4(normal * 0.5 + 0.5, 1.0);
  }
}
`;

const W = 1280;
const H = 720;
const ctx = createContext({
  width: W,
  height: H,
  element: document.querySelector("main"),
  pixelRatio: devicePixelRatio,
});

const gui = createGUI(ctx);
const State = {
  recomputeNormals: true,
  pause: false,
  mode: 0,
  shadings: ["normals", "simple lighting", "standard derivative"],
};
gui.addParam("Recompute Normals", State, "recomputeNormals");
gui.addParam("Pause", State, "pause");
gui.addRadioList(
  "Mode",
  State,
  "mode",
  State.shadings.map((name, value) => ({ name, value })),
);

const geometry = plane({ nx: 128, ny: 128 });
// geometry.positions = Array.from(geometry.positions);
// geometry.cells = Array.from(geometry.cells);

// const geometry = oldPlane(1, 1, 128, 128);
// geometry.positions = geometry.positions.flat();
// geometry.normals = geometry.normals.flat();
// // geometry.cells = geometry.cells.flat();

const clearCmd = {
  pass: ctx.pass({
    clearColor: [1, 1, 1, 1],
    clearDepth: 1,
  }),
};

const basePositions = structuredClone(geometry.positions);
const baseNormals = structuredClone(geometry.normals);
const noisePositions = structuredClone(basePositions);
let noiseNormals = structuredClone(baseNormals);

const positionsBuffer = ctx.vertexBuffer(geometry.positions);
const normalsBuffer = ctx.vertexBuffer(geometry.normals);

const drawCmd = {
  pipeline: ctx.pipeline({
    depthTest: true,
    vert: basicVert,
    frag: basicFrag,
  }),
  attributes: {
    aPosition: positionsBuffer,
    aNormal: normalsBuffer,
  },
  indices: ctx.indexBuffer(geometry.cells),
  uniforms: {
    uProjectionMatrix: mat4.perspective(
      mat4.create(),
      Math.PI / 4,
      W / H,
      0.1,
      100,
    ),
    uViewMatrix: mat4.lookAt(mat4.create(), [0, -0.9, 1], [0, 0, 0], [0, 1, 0]),
    uModelMatrix: mat4.create(),
  },
};

let dt = 0;

const frequency = 10;
const amplitude = 0.1;

const v = vec3.create();
const n = vec3.create();

ctx.frame(() => {
  if (!State.pause) dt += 0.005;

  // Update positions
  const isFlatArray = !basePositions[0]?.length;
  const l = basePositions.length / (isFlatArray ? 3 : 1);

  for (let i = 0; i < l; i++) {
    // Assuming base positions and normals are both either flat or not
    if (isFlatArray) {
      avec3.set(v, 0, basePositions, i);
      avec3.set(n, 0, baseNormals, i);
    } else {
      vec3.set(v, basePositions[i]);
      vec3.set(n, baseNormals[i]);
    }

    const f =
      amplitude *
      random.noise3(v[0] * frequency, v[1] * frequency, v[2] * frequency + dt);

    if (isFlatArray) {
      avec3.set3(
        noisePositions,
        i,
        v[0] + n[0] * f,
        v[1] + n[1] * f,
        v[2] + n[2] * f,
      );
    } else {
      noisePositions[i][0] = v[0] + n[0] * f;
      noisePositions[i][1] = v[1] + n[1] * f;
      noisePositions[i][2] = v[2] + n[2] * f;
    }
  }

  // Recompute normals
  if (State.recomputeNormals) {
    normals(noisePositions, geometry.cells, noiseNormals);
  }

  // Update buffers
  ctx.update(positionsBuffer, { data: noisePositions });
  ctx.update(normalsBuffer, {
    data: State.recomputeNormals ? noiseNormals : baseNormals,
  });

  ctx.submit(clearCmd);
  ctx.submit(drawCmd, {
    uniforms: {
      uMode: State.mode,
    },
  });

  gui.draw();
});
