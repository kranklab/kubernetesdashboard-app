import React, {useMemo} from 'react';

import {
    DataSourceVariable,
    EmbeddedScene,
    SceneApp,
    SceneAppPage,
    SceneDataProvider,
    SceneDataProviderResult,
    SceneFlexItem,
    SceneFlexLayout,
    SceneObjectBase,
    SceneObjectState,
    SceneQueryRunner,
    SceneVariableSet,
    VariableValueSelectors,
    VizPanelBuilder
} from '@grafana/scenes';
import {prefixRoute} from '../../utils/utils.routing';
import {ROUTES} from '../../constants';
import {config} from "@grafana/runtime";
import {Observable, of} from 'rxjs';
import {FieldType, LoadingState} from "@grafana/data";

const getScene = () => {
    return new SceneApp({
        pages: [
            new SceneAppPage({
                title: 'Customer Overview',
                subTitle:
                    'This scene showcases a basic scene functionality, including query runner, variable and a custom scene object.',
                url: prefixRoute(ROUTES.Home),
                getScene: () => {
                    return getHomeScene();
                },
            }),
        ],
    });
};


export interface WorkLoadData extends SceneObjectState {
    pods: number;
}

class WorkLoadDataObject extends SceneObjectBase<WorkLoadData> implements SceneDataProvider {
    setContainerWidth?: ((width: number) => void) | undefined;
    isDataReadyToDisplay():  boolean {
        return true
    };
    cancelQuery?: (() => void) | undefined;
    getResultsStream(): Observable<SceneDataProviderResult> {
        console.log("data")
        // @ts-ignore
        return of<SceneDataProviderResult>({
            // @ts-ignore
            data: {
                state: LoadingState.Done,
                series: [
                    {
                        fields:[{
                            name: "pods",
                            type: FieldType.number,
                            values: [1],
                            config: {},
                        }],
                       length:1
                    }
                ],
            },
            origin: this
        })
    }

}


const getHomeScene = () => {
    let dataSourceVariable = new DataSourceVariable({
        pluginId: "kranklab-kubernetes-datasource",
        label: "Cluster",
        value: "__datasource"
    });

    const summaryData = new WorkLoadDataObject({pods:0 })

    const queryRunner = new SceneQueryRunner({
        queries: [
            {
                refId: 'A',
                datasource: {
                    type: "kranklab-kubernetes-datasource",
                    uid: `${dataSourceVariable.state.value}`
                },
                action: "get",
                namespace: "default",
                resource: "cronjobs",
            },
            {
                refId: 'B',
                datasource: {
                    type: "kranklab-kubernetes-datasource",
                    uid: `${dataSourceVariable.state.value}`
                },
                action: "get",
                namespace: "default",
                resource: "pods",
            },
        ],
        maxDataPoints: 100,
    });

    queryRunner.addActivationHandler(() => {

        dataSourceVariable.subscribeToState(newState => {
            queryRunner.setState({
                queries: [
                    {
                        ...queryRunner.state.queries[0],
                        datasource: {
                            type: "kranklab-kubernetes-datasource",
                            uid: `${newState.value}`
                        }
                    },
                    {
                        ...queryRunner.state.queries[1],
                        datasource: {
                            type: "kranklab-kubernetes-datasource",
                            uid: `${newState.value}`
                        }
                    }
                ]
            })


            queryRunner.runQueries()
        })
    })

    queryRunner.subscribeToState(newState => {
        console.log(newState)
    })

    const panel = config.panels["grafana-polystat-panel"];

    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [dataSourceVariable]
        }),
        $data: summaryData,
        controls: [
            new VariableValueSelectors({}),
        ],
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: 400,
                    body: new VizPanelBuilder(panel.id, panel.info.version).setData(summaryData).build()
                }),
            ]
        })
    })
}

const HomePage = () => {
    const scene = useMemo(() => getScene(), []);

    return (
        <>
            <scene.Component model={scene}/>
        </>
    );
};

export default HomePage;
