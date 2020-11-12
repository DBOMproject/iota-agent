# DBoM IOTA Agent
An example agent that uses IOTA for persisted storage and exposes the CQA (Commit-Query-Audit) interface as required by the DBoM gateway

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [How to Use](#how-to-use)
  - [API](#api)
  - [Configuration](#configuration)
- [Private IOTA Tangle](#private-iota-tangle)
- [Helm Deployment](#helm-deployment)
- [Multi-Node Channel Support](#multi-node-channel-support)
  - [Supported:](#supported)
  - [Limitations:](#limitations)
    - [A possible solution to deal with these limitations is provided as an example here](#a-possible-solution-to-deal-with-these-limitations-is-provided-as-an-example-here)
- [Getting Help](#getting-help)
- [Getting Involved](#getting-involved)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How to Use

### API

Latest OpenAPI Specification for this API is available on the [api-specs repository](https://github.com/DBOMproject/deployment/blob/master/api-specs/agent)

### Configuration

| Environment Variable         | Default                                | Description                                          |
|------------------------------|----------------------------------------|------------------------------------------------------|
| DB_PATH                      | db                                     | The path where the json asset db is stored           |
| DEPTH                        | 3                                      | How many milestones in the past tip selection starts |
| LOG_LEVEL                    | info                                   | The verbosity of the logging                         |
| MAM_MODE                     | restricted                             | Type of MAM channel created                          |
| MINIMUM_WEIGHT_MAGNITUDE     | 9                                      | How much proof of work is done                       |
| PORT                         | 3000                                   | Port on which the gateway listens                    |
| PROVIDER                     | https://nodes.devnet.thetangle.org:443 | IOTA node to send and query transactions from        |
| SECURITY_LEVEL               | 2                                      | Length of signature                                  |
| JAEGER_ENABLED               | `false`                                | Is jaeger tracing enabled                            |
| JAEGER_HOST                  | ``                                     | The jaeger host to send traces to                    |
| JAEGER_SAMPLER_PARAM         | `1`                                    | The parameter to pass to the jaeger sampler          |
| JAEGER_SAMPLER_TYPE          | `const`                                | The jaeger sampler type to use                       |
| JAEGER_SERVICE_NAME          | `Iota Agent`                           | The name of the service passed to jaeger             |
| JAEGER_AGENT_SIDECAR_ENABLED | `false`                                | Is jaeger agent sidecar injection enabled            |

## Private IOTA Tangle

This agent is created to directly interface to the public IOTA node. You can also create you own private IOTA tangle. A private Tangle is one that you control and that contains only nodes that you know.

You may want to set up a private Tangle if you want to test an application without using a public IOTA network such as the Mainnet or the Devnet where everyone can see your transactions in the public Tangle.

Please refer to this [link](https://docs.iota.org/docs/compass/1.0/overview) to know more about how to setup a private IOTA tangle.

## Helm Deployment

Instructions for deploying the database-agent using helm charts can be found [here](https://github.com/DBOMproject/deployments/tree/master/charts/iota-agent)
## Multi-Node Channel Support

With the default IOTA agent, sharing channel information between 2+ nodes is currently shared by manually copying over that channel configuration to the necessary nodes. This method currently supports the following channel access abilities.

### Supported:
- 1+ node read write
- 1+ node read write, 1+ node read only
- 1+ node read write, 1+ no access to channel
- 1+ node read write, 1+ no access to channel due to no/different side key
- 1+ node read write, 1+ no access to specific assets
- Same channel across 2+ nodes, but with different name for each node
- Access to asset data without a dbom node
  - Use [Iota MaM Explorer](https://mam-explorer.firebaseapp.com/)
  - Nodejs [@iota/mam](https://www.npmjs.com/package/@iota/mam)
  - Nodejs [@iota/mam.js](https://www.npmjs.com/package/@iota/mam.js)

Given the current implementation of the example agent, there are a few limitations.

### Limitations:
- Duplication of asset ids across the nodes
  - IOTA does not throw error if writing to an existing MAM address
  - Can lead to inconsistent state
- Cannot share same db file
  - This example agent uses lowdb which is local
    - Option to use a different db with multi-node access controls

## Getting Help

If you have any queries on iota-agent, feel free to reach us on any of our [communication channels](https://github.com/DBOMproject/community/blob/master/COMMUNICATION.md) 

If you have questions, concerns, bug reports, etc, please file an issue in this repository's [issue tracker](https://github.com/DBOMproject/iota-agent/issues).

## Getting Involved

Find the instructions on how you can contribute in [CONTRIBUTING](CONTRIBUTING.md).