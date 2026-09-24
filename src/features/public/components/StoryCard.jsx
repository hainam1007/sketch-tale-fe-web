export default function StoryCard({
  story,
  featured = false,
  loading = "lazy",
}) {
  const cover = (
    <img
      src={story.cover}
      alt=""
      width="800"
      height="600"
      loading={loading}
    />
  );
  return (
    <article className={`story-card ${featured ? "featured" : ""}`}>
      <div className="cover-link" aria-hidden="true">
        {cover}
      </div>
      <div className="story-info">
        <div className="story-meta">
          <span className={`badge category-${story.id}`}>{story.category}</span>
          <span>Truyện mẫu</span>
        </div>
        <h3>
          {story.title}
        </h3>
        <p>{story.summary}</p>
      </div>
    </article>
  );
}
