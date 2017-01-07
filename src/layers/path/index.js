import { Layer, assembleShaders } from 'deck.gl'
import { GL, Model, Geometry } from 'luma.gl'
import { flatten, get } from 'lodash'

import vertex from './vertex'
import fragment from './fragment'

const DEFAULT_STROKE_COLOR = [0, 255, 0, 255]
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_OPACITY = 1

const defaultGetColor = feature => get(feature, 'properties.color')
const defaultGetWidth = feature => get(feature, 'properties.width')
const defaultGetOpacity = feature => get(feature, 'properties.opacity') || DEFAULT_STROKE_COLOR[3]

export default class PathLayer extends Layer {

  static layerName = 'PathLayer';

  /**
   * @classdesc
   * PathLayer
   *
   * @class
   * @param {object} props
   * @param {function} props.onPathHovered - provide proerties of the
   * selected path, together with the mouse event when mouse hovered
   * @param {function} props.onPathClicked - provide proerties of the
   * selected path, together with the mouse event when mouse clicked
   */
  constructor (props) {
    super({
      opacity: DEFAULT_OPACITY,
      strokeColor: DEFAULT_STROKE_COLOR,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      getColor: defaultGetColor,
      getWidth: defaultGetWidth,
      getOpacity: defaultGetOpacity,
      ...props,
    })
  }

  initializeState () {
    const { gl } = this.context
    const { attributeManager } = this.state

    attributeManager.addDynamic({
      // Primtive attributes
      indices: { size: 1, update: this.calculateIndices, isIndexed: true },
      positions: { size: 3, update: this.calculatePositions },
      prevPositions: { size: 3, update: this.calculatePrevPositions },
      nextPositions: { size: 3, update: this.calculateNextPositions },
      directions: { size: 1, update: this.calculateDirections },
      colors: {
        type: GL.UNSIGNED_BYTE,
        size: 4,
        update: this.calculateColors,
      },
      pickingColors: {
        type: GL.UNSIGNED_BYTE,
        size: 3,
        update: this.calculatePickingColors,
        noAlloc: true,
      },
    })

    const IndexType = gl.getExtension('OES_element_index_uint')
      ? Uint32Array
      : Uint16Array

    this.setState({
      model: this.getModel(gl),
      numInstances: 0,
      IndexType,
    })
  }

  updateState ({ oldProps, props, changeFlags }) {
    const { attributeManager } = this.state
    if (changeFlags.dataChanged) {
      this.extractPaths()

      this.state.pointCount = 0
      this.state.indexCount = 0

      this.state.paths.forEach(path => {
        this.state.pointCount += path.length
        // path.length - 1: n points => n-1 line segments
        // * 2 * 3: each is rendered as 2 triangles with 3 vertices
        this.state.indexCount += (path.length - 1) * 2 * 3
      })

      attributeManager.invalidateAll()
    }

    if (oldProps.opacity !== props.opacity) {
      this.setUniforms({ opacity: props.opacity })
    }
  }

  draw ({ uniforms }) {
    this.state.model.render({
      ...uniforms,
      opacity: this.props.opacity,
      thickness: this.props.strokeWidth,
      miterLimit: 4,
    })
  }

  pick (opts) {
    super.pick(opts)
    const { info } = opts
    if (!info) {
      return
    }
    const index = info.index
    const feature = index >= 0 ? this.props.data[index] : null
    info.feature = feature
    info.object = feature
  }

  getModel (gl) {
    return new Model({
      gl,
      id: this.props.id,
      ...assembleShaders(gl, {
        vs: vertex,
        fs: fragment,
      }),
      geometry: new Geometry({
        drawMode: GL.TRIANGLES,
      }),
      vertexCount: 0,
      isIndexed: true,
    })
  }

  calculateIndices (attribute) {
    const { paths, IndexType, model, indexCount } = this.state

    if (IndexType === Uint16Array && indexCount > 65535) {
      throw new Error('Vertex count exceeds browser\'s limit')
    }
    model.setVertexCount(indexCount)

    const indices = new IndexType(indexCount)

    // 1. calculate index offsets for points on paths
    const offsets = [0]
    let accLength = 0
    paths.forEach(vertices => {
      accLength += vertices.length
      offsets.push(accLength)
    })

    let i = 0
    // 2. generate mesh indices
    paths.forEach((path, pathIndex) => {
      const di = offsets[pathIndex] * 2
      const ptCount = path.length

      // counter-clockwise triangulation
      //
      //             0 |---| 2
      //  o---o  =>    o / o
      //             1 |---| 3
      //
      for (let ptIndex = 0; ptIndex < ptCount - 1; ptIndex++) {
        const startIndex = (ptIndex * 2) + di
        // triangle A with indices: 0, 1, 2
        indices[i++] = startIndex + 0
        indices[i++] = startIndex + 1
        indices[i++] = startIndex + 2
        // triangle B with indices: 2, 1, 3
        indices[i++] = startIndex + 2
        indices[i++] = startIndex + 1
        indices[i++] = startIndex + 3
      }
    })

    attribute.value = indices
    attribute.target = GL.ELEMENT_ARRAY_BUFFER
  }

  calculatePositions (attribute) {
    const { paths, pointCount } = this.state
    const positions = new Float32Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path =>
      path.forEach(point => {
        positions[i++] = point[0]
        positions[i++] = point[1]
        positions[i++] = point[2]
        positions[i++] = point[0]
        positions[i++] = point[1]
        positions[i++] = point[2]
      })
    )

    attribute.value = positions
  }

  calculatePrevPositions (attribute) {
    const { paths, pointCount } = this.state
    const prevPositions = new Float32Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path => {
      this._shiftPath(path, -1).forEach(point => {
        prevPositions[i++] = point[0]
        prevPositions[i++] = point[1]
        prevPositions[i++] = point[2]
        prevPositions[i++] = point[0]
        prevPositions[i++] = point[1]
        prevPositions[i++] = point[2]
      })
    })

    attribute.value = prevPositions
  }

  calculateNextPositions (attribute) {
    const { paths, pointCount } = this.state
    const nextPositions = new Float32Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path => {
      this._shiftPath(path, 1).forEach(point => {
        nextPositions[i++] = point[0]
        nextPositions[i++] = point[1]
        nextPositions[i++] = point[2]
        nextPositions[i++] = point[0]
        nextPositions[i++] = point[1]
        nextPositions[i++] = point[2]
      })
    })

    attribute.value = nextPositions
  }

  calculateDirections (attribute) {
    const { data, strokeWidth, getWidth } = this.props
    const { paths, pointCount } = this.state
    const directions = new Float32Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path => {
      const w = getWidth(data[path._featureIndex]) || strokeWidth
      path.forEach(() => {
        directions[i++] = w
        directions[i++] = -w
      })
    })

    attribute.value = directions
  }

  calculateColors (attribute) {
    const { data, getColor, getOpacity, strokeColor } = this.props
    const { paths, pointCount } = this.state
    const colors = new Uint8Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path => {
      const color = getColor(data[path._featureIndex]) || strokeColor
      color[3] = getOpacity(data[path._featureIndex])

      path.forEach(() => {
        colors[i++] = color[0]
        colors[i++] = color[1]
        colors[i++] = color[2]
        colors[i++] = color[3]
        colors[i++] = color[0]
        colors[i++] = color[1]
        colors[i++] = color[2]
        colors[i++] = color[3]
      })
    })

    attribute.value = colors
  }

  // Override the default picking colors calculation
  calculatePickingColors (attribute) {
    const { paths, pointCount } = this.state
    const pickingColors = new Uint8Array(pointCount * attribute.size * 2)

    let i = 0
    paths.forEach(path => {
      const pickingColor = this.encodePickingColor(path._featureIndex)
      path.forEach(() => {
        pickingColors[i++] = pickingColor[0]
        pickingColors[i++] = pickingColor[1]
        pickingColors[i++] = pickingColor[2]
        pickingColors[i++] = pickingColor[0]
        pickingColors[i++] = pickingColor[1]
        pickingColors[i++] = pickingColor[2]
      })
    })

    attribute.value = pickingColors
  }

  extractPaths () {
    const { data } = this.props
    this.state.paths = []

    if (!data) {
      return
    }

    data.forEach((feature, featureIndex) => {
      const paths = this._featureToPaths(feature)
      paths.forEach(path => {
        path._featureIndex = featureIndex
      })
      this.state.paths.push(...paths)
    })
  }

  _featureToPaths (feature) {
    const { coordinates, type } = feature.geometry

    const paths = {
      LineString: [coordinates],
      Polygon: coordinates,
      MultiLineString: coordinates,
      MultiPolygon: flatten(coordinates),
    }[type] || []

    return paths.map(
      path => path.map(
        coord => [coord[0], coord[1], coord[2] || 0]
      )
    )
  }

  _shiftPath (path, offset = 0) {
    const result = new Array(path.length)
    let point = path[0]
    for (let i = 0; i < path.length; i++) {
      point = path[i + offset] || point
      result[i] = point
    }
    return result
  }
}
