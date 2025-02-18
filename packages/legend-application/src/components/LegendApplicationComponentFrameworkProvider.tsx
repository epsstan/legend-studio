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

import { Backdrop, LegendStyleProvider, Portal } from '@finos/legend-art';
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ActionAlert } from './ActionAlert.js';
import { useApplicationStore } from './ApplicationStoreProvider.js';
import { BlockingAlert } from './BlockingAlert.js';
import { NotificationManager } from './NotificationManager.js';
import { useEffect } from 'react';
import {
  createKeybindingsHandler,
  type KeyBindingConfig,
} from '@finos/legend-shared';
import { VirtualAssistant } from './VirtualAssistant.js';

const APP_CONTAINER_ID = 'app.container';
const APP_BACKDROP_CONTAINER_ID = 'app.backdrop-container';

const PLATFORM_NATIVE_KEYBOARD_SHORTCUTS = [
  'Meta+KeyP', // Print
  'Control+KeyP',
  'Meta+KeyS', // Save
  'Control+KeyS',
  'F8', // Chrome: Developer Tools > Sources: Run or pause script
  'F10', // Chrome: Developer Tools > Sources: Step over next function call
  'F11', // Chrome: Developer Tools > Sources: Step into next function call
  'Meta+Shift+KeyP', // Chrome: Developer Tools: Open Command Prompt inside developer tools
  'Control+Shift+KeyP',
  'Meta+KeyB', // Firefox: Open bookmark sidebar
  'Control+KeyB',
  'F7', // Firefox: Caret browsing
  'Alt+F7', // Firefox: Caret browsing (Mac)
  'Control+Shift+KeyB',
];

const buildReactHotkeysConfiguration = (
  commandKeyMap: Map<string, string | undefined>,
  handlerCreator: (
    keyCombination: string,
  ) => (keyEvent?: KeyboardEvent) => void,
): KeyBindingConfig => {
  const keyMap: KeyBindingConfig = {};
  commandKeyMap.forEach((keyCombination, commandKey) => {
    if (keyCombination) {
      keyMap[commandKey] = {
        combinations: [keyCombination],
        handler: handlerCreator(keyCombination),
      };
    }
  });

  // Disable platform native keyboard shortcuts
  const PLATFORM_NATIVE_KEYBOARD_COMMAND =
    'INTERNAL__PLATFORM_NATIVE_KEYBOARD_COMMAND';
  keyMap[PLATFORM_NATIVE_KEYBOARD_COMMAND] = {
    combinations: PLATFORM_NATIVE_KEYBOARD_SHORTCUTS,
    handler: (event?: KeyboardEvent) => {
      // prevent default from potentially clashing key combinations
      event?.preventDefault();
    },
  };

  return keyMap;
};

export const forceDispatchKeyboardEvent = (event: KeyboardEvent): void => {
  document
    .getElementById(APP_CONTAINER_ID)
    ?.dispatchEvent(new KeyboardEvent(event.type, event));
};

/**
 * Potential location to mount backdrop on
 *
 * NOTE: we usually want the backdrop container to be the first child of its immediate parent
 * so that it properly lies under the content that we pick to show on top of the backdrop
 */
export const BackdropContainer: React.FC<{ elementID: string }> = (props) => (
  <div className="backdrop__container" id={props.elementID} />
);

export const LegendApplicationComponentFrameworkProvider = observer(
  (props: { children: React.ReactNode }) => {
    const { children } = props;
    const applicationStore = useApplicationStore();
    const disableContextMenu: React.MouseEventHandler = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    const backdropContainer = applicationStore.backdropContainerElementID
      ? document.getElementById(applicationStore.backdropContainerElementID) ??
        document.getElementById(APP_BACKDROP_CONTAINER_ID)
      : document.getElementById(APP_BACKDROP_CONTAINER_ID);

    const keyBindingMap = buildReactHotkeysConfiguration(
      applicationStore.keyboardShortcutsService.commandKeyMap,
      (keyCombination: string) => (event?: KeyboardEvent) => {
        // prevent default from potentially clashing key combinations with platform native keyboard shortcuts
        if (PLATFORM_NATIVE_KEYBOARD_SHORTCUTS.includes(keyCombination)) {
          event?.preventDefault();
        }
        // NOTE: Though tempting since it's a good way to simplify and potentially avoid conflicts,
        // we should not call `preventDefault()` because if we have any hotkey which is too short, such as `r`, `a`
        // we risk blocking some very common interaction, i.e. user typing, or even constructing longer
        // key combinations
        applicationStore.keyboardShortcutsService.dispatch(keyCombination);
      },
    );

    useEffect(() => {
      const onKeyEvent = createKeybindingsHandler(keyBindingMap);
      document.addEventListener('keydown', onKeyEvent);
      return () => {
        document.removeEventListener('keydown', onKeyEvent);
      };
    }, [keyBindingMap]);

    return (
      <LegendStyleProvider>
        <BlockingAlert />
        <ActionAlert />
        <NotificationManager />
        {applicationStore.showBackdrop && (
          // We use <Portal> here to insert backdrop into different parts of the app
          // as backdrop relies heavily on z-index mechanism so its location in the DOM
          // really matters.
          // For example, the default location of the backdrop works fine for most cases
          // but if we want to use the backdrop for elements within modal dialogs, we would
          // need to mount the backdrop at a different location
          <Portal container={backdropContainer}>
            <Backdrop
              className="backdrop"
              open={applicationStore.showBackdrop}
            />
          </Portal>
        )}
        <DndProvider backend={HTML5Backend}>
          <div
            className="app__container"
            // NOTE: this `id` is used to quickly identify this DOM node so we could manually
            // dispatch keyboard event here in order to be captured by our global hotkeys matchers
            id={APP_CONTAINER_ID}
            // Disable global context menu so that only places in the app that supports context-menu will be effective
            onContextMenu={disableContextMenu}
          >
            <BackdropContainer elementID={APP_BACKDROP_CONTAINER_ID} />
            <VirtualAssistant />
            {children}
          </div>
        </DndProvider>
      </LegendStyleProvider>
    );
  },
);
