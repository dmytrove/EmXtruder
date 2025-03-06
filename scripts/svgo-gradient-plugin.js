// svgo.config.js
const replaceGradientsWithSolidPlugin = {
  name: 'replaceGradientsWithSolid',
  type: 'full',
  fn: (svg) => {
    const gradientMap = {};

    // Collect gradient definitions and map IDs to the first stop's color.
    function collectGradients(node) {
      if (
        node.type === 'element' &&
        (node.name === 'linearGradient' || node.name === 'radialGradient') &&
        node.attributes &&
        node.attributes.id
      ) {
        const stops = (node.children || []).filter(
          (child) => child.type === 'element' && child.name === 'stop'
        );
        if (stops.length > 0) {
          const firstStop = stops[0];
          let color = firstStop.attributes['stop-color'];
          if (!color && firstStop.attributes.style) {
            const match = firstStop.attributes.style.match(/stop-color\s*:\s*([^;]+)/);
            if (match) color = match[1];
          }
          if (color) {
            gradientMap[node.attributes.id] = color;
          }
        }
      }
      if (node.children) {
        node.children.forEach(collectGradients);
      }
    }
    collectGradients(svg);

    // Replace gradient references in attributes and inline styles.
    function replaceGradientReferences(node) {
      if (node.type === 'element' && node.attributes) {
        if (node.attributes.fill && node.attributes.fill.startsWith('url(')) {
          const m = node.attributes.fill.match(/#([^)\s]+)/);
          if (m && gradientMap[m[1]]) {
            node.attributes.fill = gradientMap[m[1]];
          }
        }
        if (node.attributes.stroke && node.attributes.stroke.startsWith('url(')) {
          const m = node.attributes.stroke.match(/#([^)\s]+)/);
          if (m && gradientMap[m[1]]) {
            node.attributes.stroke = gradientMap[m[1]];
          }
        }
        if (node.attributes.style) {
          node.attributes.style = node.attributes.style.replace(/fill\s*:\s*url\(#([^)\s]+)\)/g, (match, gradientId) => {
            return gradientMap[gradientId] ? 'fill:' + gradientMap[gradientId] : match;
          });
          node.attributes.style = node.attributes.style.replace(/stroke\s*:\s*url\(#([^)\s]+)\)/g, (match, gradientId) => {
            return gradientMap[gradientId] ? 'stroke:' + gradientMap[gradientId] : match;
          });
        }
      }
      if (node.children) {
        node.children.forEach(replaceGradientReferences);
      }
    }
    replaceGradientReferences(svg);

    // Remove gradient definitions from the SVG.
    function removeGradients(node) {
      if (node.children) {
        node.children = node.children.filter(child => {
          return !(
            child.type === 'element' &&
            (child.name === 'linearGradient' || child.name === 'radialGradient')
          );
        });
        node.children.forEach(removeGradients);
      }
    }
    removeGradients(svg);

    return svg;
  }
};

module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
          overrides: {
              // disable a default plugin
              cleanupIds: false,

              // customize the params of a default plugin
              inlineStyles: {
                  onlyMatchedOnce: false,
              },
          },
      },
  },
    'collapseGroups',
    replaceGradientsWithSolidPlugin,
    'removeUselessDefs'
  ]
};

