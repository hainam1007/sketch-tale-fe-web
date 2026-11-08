import { moduleApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";

function asRows(response, label) {
  const rows = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(rows) || rows.some((item) => !item || typeof item !== "object" || Array.isArray(item) || typeof (item.id ?? item.Id) !== "string")) {
    throw new ApiError({ status: 502, code: "PARENT_CATALOG_RESPONSE_INVALID", message: "Backend returned an invalid " + label + " response." });
  }
  return rows;
}

function isPublishedStory(story) {
  const status = story?.status ?? story?.Status;

  // CommonStatus in the current Swagger contract: Draft=0, Pending=1,
  // Active=2, Inactive=3, Archived=4. Accept names as well for a future
  // string-enum serializer, but fail closed on missing/unknown values.
  if (Number.isInteger(status) && status >= 0 && status <= 4) {
    return status === 2;
  }

  if (typeof status === "string") {
    const normalized = status.trim().toLowerCase();
    if (["draft", "pending", "active", "inactive", "archived", "published"].includes(normalized)) {
      return normalized === "active" || normalized === "published";
    }
  }

  throw new ApiError({
    status: 502,
    code: "PARENT_STORY_STATUS_INVALID",
    message: "Backend chưa trả trạng thái xuất bản hợp lệ cho truyện.",
  });
}

function mapPage(page) {
  const pageNumber = page.pageNumber ?? page.PageNumber;
  return {
    id: page.id ?? page.Id,
    storyId: page.storyTemplateId ?? page.StoryTemplateId,
    pageNumber,
    title: `Trang ${pageNumber}`,
    text: page.rawText ?? page.RawText ?? "",
    imageUrl: page.backgroundUrl ?? page.BackgroundUrl ?? "",
    audioUrl: page.audioNarrationUrl ?? page.AudioNarrationUrl ?? "",
    status: page.status ?? page.Status,
  };
}

function mapStory(story, pages = []) {
  return {
    id: story.id ?? story.Id,
    title: story.title ?? story.Title ?? "",
    description: story.description ?? story.Description ?? "",
    categoryId: story.educationThemeId ?? story.EducationThemeId ?? "",
    category: "",
    imageUrl: story.coverImageUrl ?? story.CoverImageUrl ?? "",
    totalPageNumbers: Number.isInteger(story.totalPageNumbers ?? story.TotalPageNumbers)
      ? (story.totalPageNumbers ?? story.TotalPageNumbers)
      : 0,
    pages: [...pages].sort((a, b) => a.pageNumber - b.pageNumber),
  };
}

async function listStories({ signal } = {}) {
  const response = await moduleApiRequest("parentCatalog", { path: "/story-template/stories", signal });
  return asRows(response, "story catalog")
    .filter(isPublishedStory)
    .map((story) => mapStory(story));
}

async function listThemes({ signal } = {}) {
  const response = await moduleApiRequest("parentCatalog", { path: "/education-themes", signal });
  return asRows(response, "education themes");
}

async function listActivePages({ storyId, signal }) {
  const response = await moduleApiRequest("parentCatalog", {
    path: `/storypage-template/pages/${encodeURIComponent(storyId)}`,
    signal,
  });
  return asRows(response, "story pages")
    .filter((page) => {
      const pageStoryId = page.storyTemplateId ?? page.StoryTemplateId;
      const pageNumber = page.pageNumber ?? page.PageNumber;
      if (pageStoryId !== storyId || !Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new ApiError({
          status: 502,
          code: "PARENT_STORY_PAGE_RESPONSE_INVALID",
          message: "Backend trả về trang truyện thiếu số trang hoặc không thuộc truyện này.",
        });
      }
      const status = page.status ?? page.Status;
      if (Number.isInteger(status)) return status === 2;
      if (typeof status === "string") return status.trim().toLowerCase() === "active";
      throw new ApiError({
        status: 502,
        code: "PARENT_STORY_PAGE_STATUS_INVALID",
        message: "Backend chưa trả trạng thái phát hành hợp lệ cho trang truyện.",
      });
    })
    .map(mapPage)
    .sort((a, b) => a.pageNumber - b.pageNumber);
}

async function getStory({ storyId, signal }) {
  const response = await moduleApiRequest("parentCatalog", {
    path: "/story-template/stories/" + encodeURIComponent(storyId), signal,
  });
  if (!response || typeof (response.id ?? response.Id) !== "string") {
    throw new ApiError({ status: 502, code: "PARENT_STORY_RESPONSE_INVALID", message: "Backend returned an invalid story detail." });
  }
  if (!isPublishedStory(response)) {
    throw new ApiError({
      status: 404,
      code: "PARENT_STORY_NOT_PUBLISHED",
      message: "Truyện này chưa được phát hành cho gia đình.",
    });
  }
  const pages = await listActivePages({ storyId, signal });
  return mapStory(response, pages);
}

async function listThemesOrEmpty({ signal } = {}) {
  try {
    return await listThemes({ signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    // Themes are labels only; a category service outage should not block story reading.
    return [];
  }
}

function attachThemeName(story, themes) {
  return { ...story, category: themes.find((theme) => (theme.id ?? theme.Id) === story.categoryId)?.name || "" };
}

export const parentCatalogService = {
  list: async ({ signal } = {}) => {
    const [stories, themes] = await Promise.all([listStories({ signal }), listThemesOrEmpty({ signal })]);
    const themeNames = new Map(themes.map((theme) => [theme.id ?? theme.Id, theme.name ?? theme.Name ?? ""]));
    const items = stories.map((story) => ({ ...story, category: themeNames.get(story.categoryId) || "" }));
    return { items, total: items.length };
  },
  get: async ({ storyId, signal }) => {
    const [story, themes] = await Promise.all([getStory({ storyId, signal }), listThemesOrEmpty({ signal })]);
    return attachThemeName(story, themes);
  },
};
