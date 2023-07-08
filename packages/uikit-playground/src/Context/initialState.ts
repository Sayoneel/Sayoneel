import type { LayoutBlock } from '@rocket.chat/ui-kit';

import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import getUniqueId from '../utils/getUniqueId';
import getDate from '../utils/getDate';

export type idType = string;

export type userType = {
  id: string;
  username: string;
  name: string;
  team_id: string;
} | null;

export type actionPreviewType = {
  type?: string;
  user?: userType | null;
  api_app_id?: string;
  token?: string;
  container?: {
    type: string;
    text: string;
  };
  trigger_id?: string;
  team?: {
    id: string;
    domain: string;
  } | null;
  enterprise?: string | null;
  is_enterprise_install?: boolean;
  action?: object;
  response_url?: string;
  state?: object;
  view?: readonly LayoutBlock[];
};

export type ScreenType = {
  payload: readonly LayoutBlock[];
  id: idType;
  name: string;
  surface: SurfaceOptions;
  actionPreview: actionPreviewType;
  date: string;
  changedByEditor?: boolean;
};

export type ScreensType = {
  [key: idType]: ScreenType;
};

export type ProjectType = { id: idType; name: string; screens: idType[], date: string};

export type ProjectsType = {
  [key: idType]: ProjectType;
};

export type initialStateType = {
  isMobile: boolean;
  isTablet: boolean;
  sideBarToggle: boolean;
  templatesToggle: boolean;
  previewTabsToggle: number;
  editorTabsToggle: number;
  navMenuToggle: boolean;
  projects: ProjectsType;
  screens: ScreensType;
  activeProject: string;
  activeScreen: string;
  openCreateNewScreen: boolean;
  user: userType;
};

const initialProjectId = getUniqueId();
const initialScreenId = getUniqueId();

export const initialState: initialStateType = {
  isMobile: false,
  isTablet: false,
  sideBarToggle: false,
  templatesToggle: false,
  previewTabsToggle: 0,
  editorTabsToggle: 0,
  navMenuToggle: false,
  activeProject: initialProjectId,
  activeScreen: initialScreenId,
  openCreateNewScreen: false,
  projects: {
    [initialProjectId]: {
      id: initialProjectId,
      name: 'Untitled Project',
      screens: [initialScreenId],
      date: getDate(),
    },
  },
  screens: {
    [initialScreenId]: {
      payload: [],
      id: initialScreenId,
      name: 'Untitled Screen',
      surface: SurfaceOptions.Message,
      date: getDate(),
      actionPreview: {},
    },
  },
  user: null,
};
