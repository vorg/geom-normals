# geom-merge

Compute normals for the mesh based on faces/cells information

## Usage

```javascript
var computeNormals = require('geom-normals')
var cube = require('primitive-cube')()

var normals = computeNormals(cube.positions, cube.cells)
```

## API

### `normals(positions, cells, [out])`

- `positions` - array of [x, y, z] positions
- `cells` - array of [i, j, k] triangles
- `out` - optional array to put normals into

Returns array of computed normals, one per vertex

*Note: If there are two vertices with the same position but different index there will be discontinuity (hard edge)*

## License

MIT, see [LICENSE.md](http://github.com/vorg/geom-normals/blob/master/LICENSE.md) for details.
