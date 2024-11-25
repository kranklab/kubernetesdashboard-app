import { EmbeddedScene, SceneFlexLayout, SceneFlexItem, PanelBuilders } from '@grafana/scenes';
import { config } from '@grafana/runtime';

export function getScene() {

  const sources = []

  for (const ds of Object.values(config.datasources)) {
    if (ds.type === "kranklab-kubernetes-datasource") {
      sources.push(ds)
    }
  }

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '100%',
          height: 300,
          body: PanelBuilders.text().setTitle('Hello world panel').setOption('content', sources.map((s)=> {
            return s.name
          }).join(", ")).build(),
        }),
      ],
    }),
  });
}
