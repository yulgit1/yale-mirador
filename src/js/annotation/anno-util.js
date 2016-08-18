export default {
  
  /**
   * Returns content of first text (non-tag) resource it finds from the annotation.
   */
  getAnnotationText: function(annotation) {
    var content = null;
    var resource = annotation.resource;
    
    if (!(resource instanceof Array || resource instanceof Object)) {
      return null;
    }
    if (!(resource instanceof Array)) {
      resource = [resource];
    }
    jQuery.each(resource, function(index, value) {
      if (value['@type'] === 'dctypes:Text') {
        content = value.chars;
        return false;
      }
    });
    return content;
  },
  
  getTags: function(annotation) {
    var tags = [];

    if (jQuery.isArray(annotation.resource)) {
      jQuery.each(annotation.resource, function(index, value) {
        if (value['@type'] === "oa:Tag") {
          tags.push(value.chars);
        }
      });
    }
    return tags;
  },
  
  hasTags: function(annotation, tags) {
    const annoTags = this.getTags(annotation);
    
    for (let i = 0; i < tags.length; ++i) {
      let found = false;
      for (let j = 0; j < annoTags.length; ++j) {
        if (tags[i] === annoTags[j]) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  },
  
  // For an annotation of annotation,
  // follow the "on" relation until the eventual target annotation if found.
  findFinalTargetAnnotation: function(annotation, annotations) {
    var nextId = '';
    var nextAnno = annotation;
    var targetAnno = null;
    
    if (nextAnno.on['@type'] !== 'oa:Annotation') {
      return annotation;
    }
    
    while(nextAnno) {
      //console.log('nextAnno: ');
      //console.dir(nextAnno);
      
      if (nextAnno.on['@type'] === 'oa:Annotation') {
        nextId = nextAnno.on.full;
        nextAnno = null;
        jQuery.each(annotations, function(index, anno) {
          if (anno['@id'] === nextId) {
            targetAnno = anno;
            nextAnno = anno;
            return false;
          }
        });
      } else {
        nextAnno = null;
      }
    }
    return targetAnno;
  },
  
  /**
   * Find annotations from "annotationsList" which this "annotation" annotates 
   * and which belong to the layer with "layerId".
   */
  findTargetAnnotations: function(annotation, annotationsList, layerId) {
    var targetId = annotation.on.full;
    return annotationsList.filter(function(currentAnno) {
      return currentAnno.layerId === layerId && currentAnno['@id'] === targetId;
    });
  },

  /**
   * Find annotations from "annotationsList" which annotates this "annotation"
   * and which belong to the layer with "layerId".
   */
  findTargetingAnnotations: function(annotation, annotationsList, layerId) {
    return annotationsList.filter(function(currentAnno) {
      var targetId = currentAnno.on.full;
      return currentAnno.layerId === layerId && annotation['@id'] === targetId;
    });
  },
  
  /**
   * Find annotations from "annotationsList" that belong to the same TOC node
   * and which belong to the layer with "layerId".
   */
  findTocSiblings: function(annotation, annotationsList, layerId, toc) {
    const node = toc.findNodeForAnnotation(annotation);
    if (!node) { return []; }
    return annotationsList.filter(function(currentAnno) {
      return currentAnno.layerId === layerId &&
        toc.findNodeForAnnotation(currentAnno) === node;
    });
  }
};
