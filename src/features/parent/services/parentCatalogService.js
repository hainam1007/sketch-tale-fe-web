import { moduleApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";

function asRows(response, label) {
  const rows = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(rows) || rows.some((item) => !item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string")) {
    throw new ApiError({ status: 502, code: "PARENT_CATALOG_RESPONSE_INVALID", message: "Backend returned an invalid " + label + " response." });
  }
  return rows;
}

function mapStory(story) {
  return {
    id: story.id,
    title: story.title || "",
    description: story.description || "",
    categoryId: story.educationThemeId || "",
    category: "",
    imageUrl: story.coverImageUrl || "",
    totalPageNumbers: Number.isInteger(story.totalPageNumbers) ? story.totalPageNumbers : 0,
    pages: [],
  };
}

async function listStories({ signal } = {}) {
  const response = await moduleApiRequest("parentCatalog", { path: "/story-template/stories", signal });
  return asRows(response, "story catalog").map(mapStory);
}

async function listThemes({ signal } = {}) {
  const response = await moduleApiRequest("parentCatalog", { path: "/education-themes", signal });
  return asRows(response, "education themes");
}

async function getStory({ storyId, signal }) {
  const response = await moduleApiRequest("parentCatalog", {
    path: "/story-template/stories/" + encodeURIComponent(storyId),
    signal,
  });
  if (!response || typeof response.id !== "string") {
    throw new ApiError({ status: 502, code: "PARENT_STORY_RESPONSE_INVALID", message: "Backend returned an invalid story detail." });
  }
  return mapStory(response);
}

function attachThemeName(story, themes) {
  return { ...story, category: themes.find((theme) => theme.id === story.categoryId)?.name || "" };
}

export const parentCatalogService = {
  list: async ({ signal } = {}) => {
    const [stories, themes] = await Promise.all([listStories({ signal }), listThemes({ signal })]);
    const themeNames = new Map(themes.map((theme) => [theme.id, theme.name || ""]));
    const items = stories.map((story) => ({ ...story, category: themeNames.get(story.categoryId) || "" }));
    return { items, total: items.length };
  },
  get: async ({ storyId, signal }) => {
    const [story, themes] = await Promise.all([getStory({ storyId, signal }), listThemes({ signal })]);
    return attachThemeName(story, themes);
  },
};
