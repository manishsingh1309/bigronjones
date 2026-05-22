import { useParams, Navigate } from "react-router-dom";
import { blogStore } from "@/lib/blogStore";
import BlogArticleView from "@/components/blog/BlogArticleView";

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const blog = slug ? blogStore.getBySlug(slug) : null;

  if (!blog) return <Navigate to="/404" replace />;

  const all = blogStore.getAll();
  const sameCategory = all.filter(
    (b) => b.slug !== slug && b.category === blog.category
  );
  const others = all.filter(
    (b) => b.slug !== slug && !sameCategory.find((c) => c.slug === b.slug)
  );
  const related = [...sameCategory, ...others].slice(0, 3);

  return (
    <>
              <title>{`${blog.title} | BigRonJones`}</title>
        <meta name="description" content={blog.excerpt} />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={blog.coverImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.excerpt} />
        <meta name="twitter:image" content={blog.coverImage} />
      <BlogArticleView blog={blog} related={related} />
    </>
  );
}
