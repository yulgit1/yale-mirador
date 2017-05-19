export default class JsonToHtml {
  constructor(jsonObj) {
    this.jsonObj = jsonObj;
  }

  run() {
    const manifest = this.jsonObj;
    return template({
      manifestId: manifest.id,
      manifestLabel: manifest.label,
      ranges: manifest.ranges
    });
  }
}

const template = Handlebars.compile([
  '<html><head><title>Export</title><style>',
  '</style></head>',
  '<body>',
  '<div class="ym-export">',
  '<h1>{{manifestLabel}}</h1>',
  '<div>ID: {{manifestId}}</div>',
  '{{#each ranges as |range rangeIx|}}',
  '  <div>',
  '    <h2>{{range.label}}</h2>',
  '    {{range.id}}<br/>',
  '    {{#each range.canvases as |canvas canvasIx|}}',
  '      <div>',
  '        <h3>{{canvas.label}}</h3>',
  '        {{canvas.id}}<br/>',
  '        {{#each canvas.annotationsPerLayer as |annos layerId|}}',
  '          <h4>{{layerId}}</h4>',
  '          {{#each annos as |anno annoIx|}}',
  '            {{anno.id}}<br/><p>{{{anno.bodyText}}}<p/>',
  '          {{/each}}',
  '        {{/each}}',
  '      </div>',
  '    {{/each}}',
  '  </div>',
  '{{/each}}',
  '</div>',
  '</body>',
  '</html>'
].join(''));
