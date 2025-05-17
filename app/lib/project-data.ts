/**
 * Re-export from lib/project-data.ts to fix import path issues
 */

import {
  getProjects as originalGetProjects,
  getProjectById,
  getProjectsByCategory,
  getProjectsByRole,
  isDatabaseSetup,
  extractTagsFromRole,
  isValidUUID,
  extractVideoInfo,
  fetchYouTubeTitle,
  type Project,
  type BtsImage,
  mockProjects,
  mockBtsImages,
} from "../../lib/project-data"

// Re-export the functions and types with the same names
export {
  getProjectById,
  getProjectsByCategory,
  getProjectsByRole,
  isDatabaseSetup,
  extractTagsFromRole,
  isValidUUID,
  extractVideoInfo,
  fetchYouTubeTitle,
  type Project,
  type BtsImage,
  mockProjects,
  mockBtsImages,
}

// Named export for getProjects
export const getProjects = originalGetProjects
