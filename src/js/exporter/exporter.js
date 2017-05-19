import {Anno} from '../import';
import getLogger from '../util/logger';

const logger = getLogger();

export default class Exporter {
  constructor(options) {
    this.options = Object.assign({
      manifest: null,
      annotationExplorer: null
    }, options);
    this.canvases = {};
    this.layerIdSet = new Set();
  }

  async export() {
    logger.debug('Exporter#export manifest:', this.options.manifest);
    const manifest = this.options.manifest;
    const result = {
      id: manifest.jsonLd['@id'],
      label: manifest.jsonLd.label,
      ranges: []
    };

    for (let canvas of manifest.getCanvases()) {
      this.canvases[canvas['@id']] = canvas;
    }

    this.layers = await this.options.annotationExplorer.getLayers();
    for (let layer of this.layers) {
      this.layerIdSet.add(layer['@id']);
    }
    logger.debug('Exporter#export layers:', this.layers);

    const structures = manifest.getStructures();
    //const structures = manifest.getStructures().slice(0, 2);
    for (let range of structures) {
      let rangeData = await this._exportRange(range);
      result.ranges.push(rangeData);
    }
    logger.debug('Export#export result:', result);
    return result;
  }

  async _exportRange(range) {
    const result = {
      id: range['@id'],
      label: range.label,
      canvases: []
    };
    const annotationsByLayers = {};
    for (let layer of this.layers) {
      annotationsByLayers[layer['@id']] = [];
    }
    const canvasIds = range.canvases;
    //const canvasIds = range.canvases.slice(0, 4);
    for (let canvasId of canvasIds) {
      let canvas = this.canvases[canvasId];
      logger.debug('Canvas', canvas.label);
      let canvasData = await this._exportCanvas(canvas);
      result.canvases.push(canvasData);
    }
    return result;
  }

  async _exportCanvas(canvas) {
    const result = {
      id: canvas['@id'],
      label: canvas.label,
      annotationsPerLayer: {}
    };
    const annotations = await this.options.annotationExplorer.getAnnotations({canvasId: canvas['@id']});
    for (let annotation of annotations) {
      let $anno = Anno(annotation);
      let layerId = $anno.layerId;
      if (!this.layerIdSet.has(layerId)) {
        logger.error('Exporter#_exportCanvas unknown layer', layerId);
      }
      if (!(result[layerId] instanceof Array)) {
        result.annotationsPerLayer[layerId] = [];
      }
      let annotationData = this._exportAnnotation($anno);
      result.annotationsPerLayer[layerId].push(annotationData);
    }
    return result;
  }

  _exportAnnotation($anno) {
    const result = {
      id: $anno.id,
      bodyText: $anno.bodyText,
      tags: $anno.tags,
      targetIds: $anno.targets.map(target => target.full)
    };
    return result;
  }
}
