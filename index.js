import { avec3, vec3 } from "pex-math";

const faceSize = 3;

function normals(positions, cells, normals) {
  const isTypedArray = !Array.isArray(positions);
  const stride = isTypedArray ? 3 : 1;

  normals ||= isTypedArray ? new Float32Array(positions.length).fill() : [];

  const ab = [0, 0, 0];
  const ac = [0, 0, 0];
  const n = [0, 0, 0];

  for (let fi = 0; fi < cells.length / stride; fi++) {
    const f = isTypedArray
      ? cells.slice(fi * faceSize, fi * faceSize + faceSize)
      : cells[fi];
    const a = isTypedArray
      ? positions.slice(f[0] * 3, f[0] * 3 + 3)
      : positions[f[0]];
    const b = isTypedArray
      ? positions.slice(f[1] * 3, f[1] * 3 + 3)
      : positions[f[1]];
    const c = isTypedArray
      ? positions.slice(f[2] * 3, f[2] * 3 + 3)
      : positions[f[2]];

    vec3.normalize(vec3.sub(vec3.set(ab, b), a));
    vec3.normalize(vec3.sub(vec3.set(ac, c), a));
    vec3.normalize(vec3.cross(vec3.set(n, ab), ac));

    for (let i = 0; i < faceSize; i++) {
      if (isTypedArray) {
        if (isNaN(normals[f[i] * 3])) avec3.set3(normals, f[i], 0, 0, 0);
        avec3.add(normals, f[i], n, 0);
      } else {
        if (!normals[f[i]]) normals[f[i]] = [0, 0, 0];
        vec3.add(normals[f[i]], n);
      }
    }
  }

  for (let i = 0; i < normals.length / stride; i++) {
    if (isTypedArray) {
      if (!isNaN(normals[i * 3])) {
        avec3.normalize(normals, i);
      } else {
        avec3.set3(normals, i, 0, 1, 0);
      }
    } else {
      if (normals[i]) {
        vec3.normalize(normals[i]);
      } else {
        normals[i] = [0, 1, 0];
      }
    }
  }
  return normals;
}

export default normals;
