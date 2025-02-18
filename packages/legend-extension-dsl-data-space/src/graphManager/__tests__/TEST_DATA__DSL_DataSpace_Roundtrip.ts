/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const TEST_DATA__roundtrip = [
  {
    path: 'test::model::TestMapping',
    content: {
      _type: 'mapping',
      classMappings: [],
      enumerationMappings: [],
      includedMappings: [],
      name: 'TestMapping',
      package: 'test::model',
      tests: [],
    },
    classifierPath: 'meta::pure::mapping::Mapping',
  },
  {
    path: 'test::model::TestRuntime',
    content: {
      _type: 'runtime',
      name: 'TestRuntime',
      package: 'test::model',
      runtimeValue: {
        _type: 'engineRuntime',
        connections: [],
        mappings: [
          {
            path: 'test::model::TestMapping',
            type: 'MAPPING',
          },
        ],
      },
    },
    classifierPath: 'meta::pure::runtime::PackageableRuntime',
  },
  {
    path: 'test::model::TestDataSpace',
    content: {
      _type: 'dataSpace',
      defaultExecutionContext: 'INT',
      description: 'some description 2',
      executionContexts: [
        {
          defaultRuntime: {
            path: 'test::model::TestRuntime',
            type: 'RUNTIME',
          },
          description: 'some description 1',
          mapping: {
            path: 'test::model::TestMapping',
            type: 'MAPPING',
          },
          name: 'INT',
        },
      ],
      name: 'TestDataSpace',
      package: 'test::model',
      supportInfo: {
        _type: 'email',
        address: 'testEmail@test.org',
      },
    },
    classifierPath: 'meta::pure::metamodel::dataSpace::DataSpace',
  },
];
