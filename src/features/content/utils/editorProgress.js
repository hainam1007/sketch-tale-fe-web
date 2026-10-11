const PROGRESS_KEY = "sketchtale.content.lastPage.v1";

export function storyContinuePath(storyId) {
  let pageId = "";
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
    if (progress?.storyId === storyId) pageId = progress.pageId || "";
  } catch {
    pageId = "";
  }
  const pageQuery = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
  return `/content/stories/${storyId}/pages${pageQuery}`;
}
