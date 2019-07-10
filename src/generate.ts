export function generate (data: any): string {
  const json = JSON.stringify(data);
  return `
<!DOCTYPE html>
  <header>
    <meta charset="utf-8">
    <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui">
    <title>SANKEY Chart Experiment</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
      }
      #chart {
        height: 100%;
        width: 100%;
        position: absolute;
        left: 0;
        top: 0;
      }
    </style>
  </header>
  <body>
    <div id="chart"></div>

    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script>
      var DATA = JSON.parse('${json}');

      var link = {
        source: [],
        target: [],
        value: [],
        label: []
      };

      var nodeMap = {};
      for (var i in DATA.nodes) {
        nodeMap[DATA.nodes[i]] = i;
      }

      for (var i in DATA.links) {
        var l = DATA.links[i];
        link.source.push(nodeMap[l.source]);
        link.target.push(nodeMap[l.target]);
        link.value.push(l.value);
        // link.label.push(l.source + ' → ' + l.target);
      }

      var data = {
        type: 'sankey',
        domain: {
          x: [0, 1],
          y: [0, 1]
        },
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 30,
          line: {
            color: 'black',
            width: 0.5
          },
          label: DATA.nodes,
          color: DATA.nodes.map(v => v.substring(0, 6) === 'stack:' ? '#FF5500' : '#000000')
        },
        link: link
      };

      var layout = {
        title: 'CloudFormation Cross-stack References',
        font: {
          size: 10
        }
      };

      var options = {
        responsive: true,
        displayModeBar: true
      };

      Plotly.newPlot('chart', [ data ], layout, options);
    </script>
  </body>
</html>`;
};
