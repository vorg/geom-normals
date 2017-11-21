// similar packages
// https://github.com/hughsk/mesh-normals

var vec3 = require('pex-math/vec3')

// Compute normals for the mesh based on faces/cells information
// If there are two vertices with the same position but different index there will be discontinuity (hard edge)
function computeNormals (positions, cells, out) {
  var vertices = positions
  var faces = cells
  var normals = out || []

  normals.length = 0

  var count = []
  var ab = [0, 0, 0]
  var ac = [0, 0, 0]
  var n = [0, 0, 0]

  for (let fi = 0, numFaces = faces.length; fi < numFaces; fi++) {
    var f = faces[fi]
    var a = vertices[f[0]]
    var b = vertices[f[1]]
    var c = vertices[f[2]]
    vec3.normalize(vec3.sub(vec3.set(ab, b), a))
    vec3.normalize(vec3.sub(vec3.set(ac, c), a))
    vec3.normalize(vec3.cross(vec3.set(n, ab), ac))
    for (let i = 0, len = f.length; i < len; i++) {
      if (!normals[f[i]]) {
        normals[f[i]] = [0, 0, 0]
      }
      vec3.add(normals[f[i]], n)
      count[f[i]] = count[f[i]] ? 1 : count[f[i]] + 1
    }
  }

  for (let i = 0, len = normals.length; i < len; i++) {
    if (normals[i]) {
      vec3.normalize(normals[i])
    } else {
      normals[i] = [0, 1, 0]
    }
  }
  return normals
}

module.exports = computeNormals
