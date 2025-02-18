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

import { useEffect } from 'react';
import { prettyCONSTName } from '@finos/legend-shared';
import { observer } from 'mobx-react-lite';
import {
  ProjectConfigurationEditorState,
  CONFIGURATION_EDITOR_TAB,
} from '../../../../stores/editor-state/project-configuration-editor-state/ProjectConfigurationEditorState.js';
import {
  clsx,
  PlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Panel,
  PanelForm,
  PanelFormTextField,
  CheckSquareIcon,
  SquareIcon,
  ExclamationTriangleIcon,
} from '@finos/legend-art';
import { flowResult } from 'mobx';
import {
  type Platform,
  PlatformConfiguration,
  ProjectDependency,
  type ProjectConfiguration,
} from '@finos/legend-server-sdlc';
import { useEditorStore } from '../../EditorStoreProvider.js';
import {
  DocumentationPreview,
  LEGEND_APPLICATION_DOCUMENTATION_KEY,
  useApplicationStore,
} from '@finos/legend-application';
import { ProjectDependencyEditor } from './ProjectDependencyEditor.js';
import type { ProjectData } from '@finos/legend-server-depot';

const ProjectStructureEditor = observer(
  (props: { projectConfig: ProjectConfiguration; isReadOnly: boolean }) => {
    const { projectConfig, isReadOnly } = props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const latestVersion =
      editorStore.projectConfigurationEditorState.latestProjectStructureVersion;
    const currentProjectExtensionVersion =
      projectConfig.projectStructureVersion.extensionVersion ?? -1;
    const latestProjectExtensionVersion = latestVersion?.extensionVersion ?? -1;
    const isVersionOutdated =
      latestVersion &&
      (latestVersion.version > projectConfig.projectStructureVersion.version ||
        latestProjectExtensionVersion > currentProjectExtensionVersion);
    const updateVersion = (): void => {
      flowResult(
        editorStore.projectConfigurationEditorState.updateToLatestStructure(),
      ).catch(applicationStore.alertUnhandledError);
    };

    return (
      <div className="panel__content__lists">
        <div className="project-configuration-editor__project__structure__version">
          <div className="project-configuration-editor__project__structure__version__label">
            <div className="project-configuration-editor__project__structure__version__label__status">
              {isVersionOutdated ? (
                <ExclamationCircleIcon
                  className="project-configuration-editor__project__structure__version__label__status--outdated"
                  title="Project structure is outdated"
                />
              ) : (
                <CheckCircleIcon
                  className="project-configuration-editor__project__structure__version__label__status--up-to-date"
                  title="Project structure is up to date"
                />
              )}
            </div>
            <div className="project-configuration-editor__project__structure__version__label__text">
              PROJECT STRUCTURE VERSION{' '}
              {` ${projectConfig.projectStructureVersion.fullVersion}`}
            </div>
          </div>
          {isVersionOutdated && (
            <button
              className="project-configuration-editor__project__structure__version__update-btn"
              disabled={isReadOnly}
              onClick={updateVersion}
              tabIndex={-1}
              title={`Current project structure is outdated. Click to update to the latest version (v${latestVersion.fullVersion}})`}
            >
              Update to version {latestVersion.fullVersion}
            </button>
          )}
        </div>

        <PanelForm>
          <PanelFormTextField
            isReadOnly={isReadOnly}
            value={projectConfig.groupId}
            name="Group ID"
            prompt="The domain for artifacts generated as part of the project build
              pipeline and published to an artifact repository"
            update={(value: string | undefined): void =>
              projectConfig.setGroupId(value ?? '')
            }
          />
          <PanelFormTextField
            isReadOnly={isReadOnly}
            value={projectConfig.artifactId}
            name="Artifact ID"
            prompt="The identifier (within the domain specified by group ID) for
              artifacts generated as part of the project build pipeline and
              published to an artifact repository"
            update={(value: string | undefined): void =>
              projectConfig.setArtifactId(value ?? '')
            }
          />
        </PanelForm>
      </div>
    );
  },
);

const PlatformDependencyViewer = observer(
  (props: {
    platform: PlatformConfiguration;
    isDefault: boolean;
    isLatestVersion?: boolean | undefined;
  }) => {
    const { platform, isDefault, isLatestVersion } = props;

    return (
      <div className="platform-configurations-editor__dependency">
        <div className="platform-configurations-editor__dependency__label">
          <div className="platform-configurations-editor__dependency__label__status">
            {isDefault && (
              <CheckCircleIcon
                className="platform-configurations-editor__dependency__label__status--default"
                title="Platform version is up to date"
              />
            )}
            {isLatestVersion !== undefined &&
              (isLatestVersion ? (
                <CheckCircleIcon
                  className="platform-configurations-editor__dependency__label__status--up-to-date"
                  title="Platform version is up to date"
                />
              ) : (
                <ExclamationTriangleIcon
                  className="platform-configurations-editor__dependency__label__status--outdated"
                  title="Platform version is outdated"
                />
              ))}
          </div>
          <div className="platform-configurations-editor__dependency__label__text">
            {platform.name}
          </div>
          <div
            className={clsx(
              'platform-configurations-editor__dependency__label__version',
            )}
          >
            {platform.version}
          </div>
        </div>
      </div>
    );
  },
);

const ProjectPlatformVersionEditor = observer(
  (props: { projectConfig: ProjectConfiguration; isReadOnly: boolean }) => {
    const { projectConfig, isReadOnly } = props;
    const editorStore = useEditorStore();

    const convertPlatformtoPlatformConfiguration = (
      platforms: Platform[] | undefined,
    ): PlatformConfiguration[] | undefined => {
      if (platforms) {
        return platforms.map(
          (platform) =>
            new PlatformConfiguration(platform.name, platform.platformVersion),
        );
      } else {
        return undefined;
      }
    };

    const platformConfigurations = projectConfig.platformConfigurations;
    const defaultPlatforms = convertPlatformtoPlatformConfiguration(
      editorStore.sdlcServerClient.platforms,
    );
    const isUpToDate = platformConfigurations?.every(
      (conf) =>
        defaultPlatforms?.find((p) => p.name === conf.name)?.version ===
        conf.version,
    );
    const updateLatestToLatestVersion = (): void => {
      if (platformConfigurations && defaultPlatforms) {
        projectConfig.setPlatformConfigurations(
          platformConfigurations.map((conf) => {
            const matchingPlatformConfig = defaultPlatforms.find(
              (p) => p.name === conf.name,
            );
            if (matchingPlatformConfig) {
              return matchingPlatformConfig;
            }
            return conf;
          }),
        );
      }
    };

    const toggleOverridePlatformConfigurations = (): void => {
      if (!projectConfig.platformConfigurations) {
        projectConfig.setPlatformConfigurations(defaultPlatforms);
      } else {
        projectConfig.setPlatformConfigurations(undefined);
      }
    };

    return (
      <Panel>
        <PanelForm>
          <DocumentationPreview
            text="By default, your project will use the latest platform
              dependencies' versions (e.g. engine, sdlc, etc.) in the pipeline.
              This might be undesirable when you want to produce stable
              artifacts; in this case, you can freeze the platform dependencies'
              versions"
            documentationKey={
              LEGEND_APPLICATION_DOCUMENTATION_KEY.QUESTION_WHEN_TO_CONFIGURE_PLATFORM_VERSIONS
            }
          />
          <div className="platform-configurations-editor__dependencies">
            <div className="platform-configurations-editor__dependencies__header">
              <div className="platform-configurations-editor__dependencies__header__left">
                <div
                  className="platform-configurations-editor__toggler"
                  onClick={toggleOverridePlatformConfigurations}
                >
                  <button
                    className={clsx(
                      'platform-configurations-editor__toggler__btn',
                      {
                        'platform-configurations-editor__toggler__btn--toggled':
                          Boolean(platformConfigurations),
                      },
                    )}
                    disabled={isReadOnly}
                    tabIndex={-1}
                  >
                    {platformConfigurations ? (
                      <CheckSquareIcon />
                    ) : (
                      <SquareIcon />
                    )}
                  </button>
                  <div className="platform-configurations-editor__toggler__prompt">
                    {`Override platform dependencies' versions`}
                  </div>
                </div>
              </div>
              {platformConfigurations && !isUpToDate && (
                <div className="platform-configurations-editor__dependencies__header__right">
                  <button
                    className="btn btn--dark"
                    tabIndex={-1}
                    onClick={updateLatestToLatestVersion}
                  >
                    Update to the current latest platform version
                  </button>
                </div>
              )}
            </div>
            <div className="platform-configurations-editor__dependencies__content">
              {!platformConfigurations &&
                defaultPlatforms?.map((p) => (
                  <PlatformDependencyViewer
                    key={p.name}
                    isDefault={true}
                    platform={p}
                  />
                ))}
              {platformConfigurations?.map((p) => (
                <PlatformDependencyViewer
                  key={p.name}
                  platform={p}
                  isDefault={false}
                  isLatestVersion={isUpToDate}
                />
              ))}
            </div>
          </div>
        </PanelForm>
      </Panel>
    );
  },
);

export const ProjectConfigurationEditor = observer(() => {
  const editorStore = useEditorStore();
  const applicationStore = useApplicationStore();
  const configState = editorStore.tabManagerState.getCurrentEditorState(
    ProjectConfigurationEditorState,
  );
  const sdlcState = editorStore.sdlcState;
  const isReadOnly = editorStore.isInViewerMode;
  const selectedTab = configState.selectedTab;
  const tabs = [
    CONFIGURATION_EDITOR_TAB.PROJECT_STRUCTURE,
    CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES,
    CONFIGURATION_EDITOR_TAB.PLATFORM_CONFIGURATIONS,
  ];
  const changeTab =
    (tab: CONFIGURATION_EDITOR_TAB): (() => void) =>
    (): void =>
      configState.setSelectedTab(tab);
  let addButtonTitle = '';
  switch (selectedTab) {
    case CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES:
      addButtonTitle = 'Add project dependencies';
      break;
    default:
      break;
  }
  const currentProjectConfiguration = configState.currentProjectConfiguration;
  const addValue = (): void => {
    if (!isReadOnly) {
      if (selectedTab === CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES) {
        const currentProjects = Array.from(configState.projects.values());
        if (currentProjects.length) {
          const projectToAdd = currentProjects[0] as ProjectData;
          const dependencyToAdd = new ProjectDependency(
            projectToAdd.coordinates,
          );
          dependencyToAdd.setVersionId(projectToAdd.latestVersion);
          currentProjectConfiguration.addProjectDependency(dependencyToAdd);
          flowResult(
            configState.projectDependencyEditorState.fetchDependencyReport(),
          ).catch(applicationStore.alertUnhandledError);
        } else {
          currentProjectConfiguration.addProjectDependency(
            new ProjectDependency(''),
          );
        }
      }
    }
  };
  const disableAddButton =
    selectedTab !== CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES || isReadOnly;
  const updateConfigs = (): void => {
    editorStore.localChangesState.alertUnsavedChanges((): void => {
      flowResult(configState.updateConfigs()).catch(
        applicationStore.alertUnhandledError,
      );
    });
  };
  useEffect(() => {
    if (
      configState.projectConfiguration &&
      selectedTab === CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES &&
      !configState.associatedProjectsAndVersionsFetched
    ) {
      flowResult(configState.fectchAssociatedProjectsAndVersions()).catch(
        applicationStore.alertUnhandledError,
      );
      flowResult(
        configState.projectDependencyEditorState.fetchDependencyReport(),
      ).catch(applicationStore.alertUnhandledError);
    }
  }, [applicationStore, configState, selectedTab]);

  if (!configState.projectConfiguration) {
    return null;
  }
  return (
    <div className="project-configuration-editor">
      <Panel>
        <div className="panel__header">
          <div className="panel__header__title">
            <div className="panel__header__title__label">
              project configuration
            </div>
            <div className="panel__header__title__content">
              {sdlcState.currentProject?.name ?? '(unknown)'}
            </div>
          </div>
          <button
            // TODO: remove this ugly button when we integrate project configuration into change detection flow
            className="project-configuration-editor__update-btn"
            disabled={
              isReadOnly ||
              configState.updatingConfigurationState.isInProgress ||
              currentProjectConfiguration.hashCode ===
                configState.originalConfig.hashCode
            }
            onClick={updateConfigs}
            tabIndex={-1}
          >
            Update
          </button>
        </div>
        <div className="panel__header project-configuration-editor__tabs__header">
          <div className="project-configuration-editor__tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={changeTab(tab)}
                className={clsx('project-configuration-editor__tab', {
                  'project-configuration-editor__tab--active':
                    tab === selectedTab,
                })}
              >
                {prettyCONSTName(tab)}
              </button>
            ))}
          </div>
          <div className="panel__header__actions">
            <button
              className="panel__header__action"
              disabled={disableAddButton}
              tabIndex={-1}
              onClick={addValue}
              title={addButtonTitle}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        <div className="panel__content project-configuration-editor__content">
          {selectedTab === CONFIGURATION_EDITOR_TAB.PROJECT_STRUCTURE && (
            <ProjectStructureEditor
              projectConfig={currentProjectConfiguration}
              isReadOnly={isReadOnly}
            />
          )}
          {selectedTab === CONFIGURATION_EDITOR_TAB.PROJECT_DEPENDENCIES && (
            <ProjectDependencyEditor />
          )}
          {selectedTab === CONFIGURATION_EDITOR_TAB.PLATFORM_CONFIGURATIONS && (
            <ProjectPlatformVersionEditor
              projectConfig={currentProjectConfiguration}
              isReadOnly={isReadOnly}
            />
          )}
        </div>
      </Panel>
    </div>
  );
});
