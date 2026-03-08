import { map } from 'rxjs';
import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';

/**
 * Wraps a query runner with a transformer that injects data links directly
 * onto the `name` field config in the raw data frame. This bypasses the field
 * config override registry and works reliably with Grafana 12's TableNG renderer,
 * which reads `field.config.links` directly in MaybeWrapWithLink.
 */
export function withNameLinks(runner: SceneQueryRunner, url: string): SceneDataTransformer {
  return new SceneDataTransformer({
    $data: runner,
    transformations: [
      () =>
        map((frames) =>
          frames.map((frame) => ({
            ...frame,
            fields: frame.fields.map((field) =>
              field.name.toLowerCase() === 'name'
                ? { ...field, config: { ...field.config, links: [{ title: 'View', url }] } }
                : field
            ),
          }))
        ),
    ],
  });
}
