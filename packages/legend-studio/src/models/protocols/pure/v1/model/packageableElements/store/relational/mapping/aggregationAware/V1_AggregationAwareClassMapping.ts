/**
 * Copyright 2020 Goldman Sachs
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

import type { V1_ClassMappingVisitor } from '../../../../../../model/packageableElements/mapping/V1_ClassMapping';
import { V1_ClassMapping } from '../../../../../../model/packageableElements/mapping/V1_ClassMapping';
import type { V1_PropertyMapping } from '../../../../../../model/packageableElements/mapping/V1_PropertyMapping';
import type { V1_AggregateSetImplementationContainer } from './V1_AggregateSetImplementationContainer';

export class V1_AggregationAwareClassMapping extends V1_ClassMapping {
  mainSetImplementation!: V1_ClassMapping;
  propertyMappings: V1_PropertyMapping[] = [];
  aggregateSetImplementations: V1_AggregateSetImplementationContainer[] = [];

  accept_ClassMappingVisitor<T>(visitor: V1_ClassMappingVisitor<T>): T {
    return visitor.visit_AggregationAwareClassMapping(this);
  }
}
