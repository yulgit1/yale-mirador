import getLogger from './util/logger';
import getMiradorProxyManager from './mirador-proxy/mirador-proxy-manager';
import AnnotationListRenderer from './annotation/annotation-list-renderer';
import AnnotationWindow from './annotation/annotation-window';

export default class {
  constructor(rootElementId) {
    this.logger = getLogger();
    this.init(rootElementId);
  }

  init(rootElementId) {
    this.logger.debug('Grid#init');
    this.element = jQuery('#' + rootElementId);
    this.miradorProxyManager = getMiradorProxyManager();

    this._annotationWindows = {};

    this.initLayout();
    this.bindEvents();
  }

  // GoldenLayout
  initLayout() {
    const _this = this;
    const config = {
      settings: {
        hasHeaders: true,
        showPopoutIcon: false,
        selectionEnabled: false
      },
      dimensions: {
        minItemWidth: 200,
        minItemHeight: 200
      },
      content: [{
        type: 'row',
        content: [/*{
          type: 'component',
          componentName: 'Mirador',
          componentState: { label: 'Mirador' },
          isClosable: false
        }*/]
      }]
    };

    this.layout = new GoldenLayout(config, this.element);

    this.layout.registerComponent('Mirador', function (container, componentState) {
      const id = componentState.miradorId;
      const template = Handlebars.compile(jQuery('#viewer_template').html());
      container.getElement().html(template({ id: id }));
    });

    this.layout.registerComponent('Annotations', function (container, componentState) {
      const id = componentState.windowId;
      const appendTo = jQuery('<div/>').attr('id', id);
      container.getElement().html(appendTo[0].outerHTML);
    });

    this.layout.on('stateChanged', function (e) {
      _this.logger.debug('GoldenLayout stateChanged');
      jQuery.each(_this.miradorProxyManager.getMiradorProxies(), function(key, miradorProxy) {
        miradorProxy.publish('resizeMirador');
      });
      return true;
    });

    this.layout.init();
  }

  resize() {
    this.logger.debug('Grid#resize');
    this.element.css('bottom', 0);
    this.layout.updateSize();
  }

  addMiradorWindow(miradorId) {
    this.logger.debug('Grid#addMiradorWindow');
    const windowId = Mirador.genUUID();
    const itemConfig = {
      type: 'component',
      componentName: 'Mirador',
      componentState: { miradorId: miradorId }
    };
    this.layout.root.contentItems[0].addChild(itemConfig);
  }

  addWindows(config) {
    this.logger.debug('Grid#addWindows config:', config);
    for (let windowConfig of config.windows) {
      windowConfig.miradorId = config.miradorId;
      this.addWindow(windowConfig);
    }
  }

  addWindow(options) {
    this.logger.debug('Grid#addWindow', options);
    const _this = this;
    const windowId = Mirador.genUUID();
    const itemConfig = {
      type: 'component',
      componentName: 'Annotations',
      componentState: { windowId: windowId }
    };
    this.layout.root.contentItems[0].addChild(itemConfig);

    return new AnnotationWindow({ appendTo: jQuery('#' + windowId),
      annotationListRenderer: new AnnotationListRenderer(),
      miradorId: options.miradorId,
      initialLayerId: options.layerId || null,
      initialTocTags: options.tocTags || null,
      annotationId: options.annotationId || null
    })
    .then(function(window) {
      _this._annotationWindows[windowId] = window;
      return window;
    })
    .catch((reason) => { throw reason; });
  }

  bindEvents() {
    const _this = this;

    this.layout.on('itemDestroyed', function(item) {
      _this.logger.debug('itemDestroyed', item);

      if (item.componentName == 'Annotations') {
        const windowId = item.config.componentState.windowId;
        _this.logger.debug('Annotatin window ' + windowId);
        delete _this._annotationWindows[windowId];
      }
    });

    jQuery.subscribe('YM_ADD_WINDOW', function(event, options) {
      _this.addWindow(options || {});
    });

    jQuery.subscribe('YM_ADD_WINDOWS', function(event, config) {
      _this.logger.debug('Received YM_ADD_WINDOWS config:', config);
      _this.addWindows(config);
    });
  }

  showAnnotation(miradorId, windowId, annoId) {
    this.logger.debug('Grid#showAnnotation miradorId: ' + miradorId +
      ', windowId: ' + windowId + ', annoId: ' + annoId);
    const miradorProxy = this.miradorProxyManager.getMiradorProxy(miradorId);
    const windowProxy = miradorProxy.getWindowProxyById(windowId);
    const annotations = windowProxy.getAnnotationsList();
    const annotation = annotations.filter(anno => anno['@id'] === annoId)[0];
    let found = false;

    jQuery.each(this._annotationWindows, function(key, annoWindow) {
      let success = annoWindow.scrollToAnnotation(annoId);
      if (success) {
        annoWindow.highlightAnnotation(annoId);
      }
      found = found || success;
    });
    if (!found) {
      if (annotation) {
        this.addWindow({
          miradorId: miradorId,
          layerId: annotation.layerId
        }).then(function(annoWindow) {
          annoWindow.scrollToAnnotation(annoId);
        }).catch(function(reason) {
          _this.logger.error('Grid#showAnnotation addWindow failed <- ' + reason);
        });
      } else {
        _this.logger.error('Grid#showAnnotation annotation not found from endpoint, id: ' + annoId);
      }
    }
  }
}
