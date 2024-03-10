import { avec3, vec3 } from "pex-math";

const TEMP_0 = vec3.create();
const TEMP_1 = vec3.create();
const TEMP_2 = vec3.create();

function normals(positions, cells, normals) {
  const isFlatArray = !positions[0]?.length;
  const isCellsFlatArray = !cells[0]?.length;
  const l = cells.length / (isCellsFlatArray ? 3 : 1);

  if (isFlatArray) {
    normals ||= new positions.constructor(positions.length).fill(0);

    for (let fi = 0; fi < l; fi++) {
      if (isCellsFlatArray) {
        avec3.set(TEMP_0, 0, cells, fi);
      } else {
        vec3.set(TEMP_0, cells[fi]);
      }

      avec3.set(TEMP_1, 0, positions, TEMP_0[1]); // b
      avec3.sub(TEMP_1, 0, positions, TEMP_0[0]); // ab = b - a
      avec3.normalize(TEMP_1, 0);

      avec3.set(TEMP_2, 0, positions, TEMP_0[2]); // c
      avec3.sub(TEMP_2, 0, positions, TEMP_0[0]); // ac = c - a
      avec3.normalize(TEMP_2, 0);

      avec3.cross(TEMP_1, 0, TEMP_2, 0); // ab x ac
      avec3.normalize(TEMP_1, 0);

      for (let i = 0; i < 3; i++) {
        avec3.add(normals, TEMP_0[i], TEMP_1, 0);
      }
    }

    for (let i = 0; i < positions.length / 3; i++) {
      if (!isNaN(normals[i * 3])) {
        avec3.normalize(normals, i);
      } else {
        avec3.set3(normals, i, 0, 1, 0);
      }
    }

    return normals;
  }

  normals ||= [];

  for (let fi = 0; fi < l; fi++) {
    if (isCellsFlatArray) {
      avec3.set(TEMP_0, 0, cells, fi);
    } else {
      vec3.set(TEMP_0, cells[fi]);
    }

    const a = positions[TEMP_0[0]];

    vec3.normalize(vec3.sub(vec3.set(TEMP_1, positions[TEMP_0[1]]), a)); // ab = b - a
    vec3.normalize(vec3.sub(vec3.set(TEMP_2, positions[TEMP_0[2]]), a)); // ac = c - a
    vec3.normalize(vec3.cross(TEMP_1, TEMP_2)); // ab x ac

    for (let i = 0; i < 3; i++) {
      normals[TEMP_0[i]] ||= [0, 0, 0];
      vec3.add(normals[TEMP_0[i]], TEMP_1);
    }
  }

  for (let i = 0; i < normals.length; i++) {
    if (normals[i]) {
      vec3.normalize(normals[i]);
    } else {
      normals[i] = [0, 1, 0];
    }
  }

  return normals;
}

export default normals;
