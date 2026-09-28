import PostPreview from "./PostPreview";

export default function PostList({ userPosts }) {
    return userPosts.map((post, idx) => (
        <div
            key={post.id}
            className="post-card-animated-wrapper"
            style={{ animationDelay: `${idx * 0.1}s` }}
        >
            <PostPreview post={post} />
        </div>
        ))    
}