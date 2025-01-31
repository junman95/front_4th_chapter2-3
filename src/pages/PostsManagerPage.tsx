import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Card, CardContent, CardHeader, CardTitle } from "../shared/ui"
import { NewPost, Post } from "../entities/post/model/types"
import { Comment } from "../entities/comment/model/types"
import {
  CommentAddModal,
  CommentEditModal,
  PostAddModal,
  PostDetailModal,
  PostEditModal,
  UserInfoModal,
} from "../widgets/ui/modals"
import CommentList from "../features/comment/ui/CommentList"
import Pagination from "../features/post/ui/Pagination"
import Filter from "../features/post/ui/Filter"
import { User } from "../entities/user/model/types"
import PTable from "../features/post/ui/PTable"
import { useAddComment } from "../features/comment/model/useAddComment.query"
import { useAddPost } from "../features/post/model/useAddPost.query"
import { useGetPosts } from "../features/post/model/useGetPosts.query"
import { useUpdatePost } from "../features/post/model/useUpdatePost.query"
import { useUpdateComment } from "../features/comment/model/useUpdateComment.query"
import { usePostStore } from "../entities/post/model/usePost.store"

const PostsManager = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  // 상태 관리

  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(parseInt(queryParams.get("skip") || "0"))
  const [limit, setLimit] = useState(parseInt(queryParams.get("limit") || "10"))
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [sortBy, setSortBy] = useState(queryParams.get("sortBy") || "")
  const [sortOrder, setSortOrder] = useState(
    queryParams.get("sortOrder") || "asc",
  )
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newPost, setNewPost] = useState<NewPost>({
    title: "",
    body: "",
    userId: 1,
  })
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(queryParams.get("tag") || "")
  const [comments, setComments] = useState<{ [key in number]: Comment[] }>({})
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false)
  const [showEditCommentDialog, setShowEditCommentDialog] = useState(false)
  const [showPostDetailDialog, setShowPostDetailDialog] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const { newComment, setNewComment, handleAddComment } = useAddComment({
    onSuccess: (responseComment) => {
      setComments((prev) => ({
        ...prev,
        [responseComment.postId]: [
          ...(prev[responseComment.postId] || []),
          responseComment,
        ],
      }))
    },
    fallback: () => {
      setShowAddCommentDialog(false)
    },
  })

  const { posts } = usePostStore()

  const {
    isLoading: isLoadingPosts,
    searchQuery,
    refetchGetPosts,
    handlers: {
      handleInputChange,
      handleKeyDown,
      handleAddPost,
      handleUpdatePost,
    },
  } = useGetPosts({
    limit,
    skip,
  })

  const { addPost } = useAddPost({
    onSuccess: handleAddPost,
    fallback: () => {
      setShowAddDialog(false)
      setNewPost({ title: "", body: "", userId: 1 })
    },
  })

  useEffect(() => {
    if (isLoadingPosts) setLoading(true)
    else setLoading(false)
  }, [isLoadingPosts])

  // URL 업데이트 함수
  const updateURL = () => {
    const params = new URLSearchParams()
    if (skip) params.set("skip", skip.toString())
    if (limit) params.set("limit", limit.toString())
    if (searchQuery) params.set("search", searchQuery)
    if (sortBy) params.set("sortBy", sortBy)
    if (sortOrder) params.set("sortOrder", sortOrder)
    if (selectedTag) params.set("tag", selectedTag)
    navigate(`?${params.toString()}`)
  }

  // 태그 가져오기
  const fetchTags = async () => {
    try {
      const response = await fetch("/api/posts/tags")
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error("태그 가져오기 오류:", error)
    }
  }

  // 태그별 게시물 가져오기
  const fetchPostsByTag = async (tag: Post["tags"][0]) => {
    if (!tag || tag === "all") {
      refetchGetPosts()
      return
    }
    setLoading(true)
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch(`/api/posts/tag/${tag}`),
        fetch("/api/users?limit=0&select=username,image"),
      ])
      const postsData = (await postsResponse.json()) as {
        posts: Omit<Post, "author">[]
        total: number
      }
      const usersData = (await usersResponse.json()) as { users: User[] }

      // const postsWithUsers: Post[] = postsData.posts.map((post) => ({
      //   ...post,
      //   author: usersData.users.find((user) => user.id === post.userId) as User,
      // }))

      setTotal(postsData.total)
    } catch (error) {
      console.error("태그별 게시물 가져오기 오류:", error)
    }
    setLoading(false)
  }

  // 게시물 업데이트
  const { updatePost } = useUpdatePost({
    onSuccess: (post) => {
      handleUpdatePost(post)
      setShowEditDialog(false)
    },
  })

  // 게시물 삭제
  const deletePost = async (id: Post["id"]) => {
    try {
      await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      })
      // setPosts(posts.filter((post) => post.id !== id))
    } catch (error) {
      console.error("게시물 삭제 오류:", error)
    }
  }

  // 댓글 업데이트
  const { updateComment } = useUpdateComment({
    onSuccess: (responseComment) => {
      console.log(comments)
      setComments((prev) => ({
        ...prev,
        [responseComment.postId]: prev[responseComment.postId].map((comment) =>
          comment.id === responseComment.id ? responseComment : comment,
        ),
      }))
      setShowEditCommentDialog(false)
    },
    onError: (error) => {
      console.error("댓글 업데이트 오류:", error)
    },
  })

  // 댓글 삭제
  const deleteComment = async (
    id: Comment["id"],
    postId: Comment["postId"],
  ) => {
    try {
      await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      })
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((comment) => comment.id !== id),
      }))
    } catch (error) {
      console.error("댓글 삭제 오류:", error)
    }
  }

  // 댓글 좋아요
  const likeComment = async (id: Comment["id"], postId: Comment["postId"]) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          likes: (comments[postId].find((c) => c.id === id)?.likes || 0) + 1,
        }),
      })
      const data = await response.json()
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].map((comment) =>
          comment.id === data.id
            ? { ...data, likes: comment.likes + 1 }
            : comment,
        ),
      }))
    } catch (error) {
      console.error("댓글 좋아요 오류:", error)
    }
  }

  // 게시물 상세 보기
  const openPostDetail = (post: Post) => {
    setSelectedPost(post)
    setShowPostDetailDialog(true)
  }

  // 사용자 모달 열기
  const openUserModal = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`)
      const userData = await response.json()
      setSelectedUser(userData)
      setShowUserModal(true)
    } catch (error) {
      console.error("사용자 정보 가져오기 오류:", error)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    if (selectedTag) {
      fetchPostsByTag(selectedTag)
    } else {
      refetchGetPosts()
    }
    updateURL()
  }, [skip, limit, sortBy, sortOrder, selectedTag])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSkip(parseInt(params.get("skip") || "0"))
    setLimit(parseInt(params.get("limit") || "10"))
    setSortBy(params.get("sortBy") || "")
    setSortOrder(params.get("sortOrder") || "asc")
    setSelectedTag(params.get("tag") || "")
  }, [location.search])

  // 게시물 테이블 렌더링

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>게시물 관리자</span>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            게시물 추가
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* 검색 및 필터 컨트롤 */}
          <Filter
            searchQuery={searchQuery}
            setSearchQuery={handleInputChange}
            handleEnterSearchQuery={handleKeyDown}
            tags={tags}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            fetchPostsByTag={fetchPostsByTag}
            updateURL={updateURL}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* 게시물 테이블 */}
          {loading ? (
            <div className="flex justify-center p-4">로딩 중...</div>
          ) : (
            <PTable
              posts={posts || []}
              openPostDetail={openPostDetail}
              deletePost={deletePost}
              openUserModal={openUserModal}
              setSelectedPost={setSelectedPost}
              setShowEditDialog={setShowEditDialog}
              setSelectedTag={setSelectedTag}
              updateURL={updateURL}
              searchQuery={searchQuery}
              selectedTag={selectedTag}
            />
          )}

          {/* 페이지네이션 */}
          <Pagination
            limit={limit}
            setLimit={setLimit}
            skip={skip}
            setSkip={setSkip}
            total={total}
          />
        </div>
      </CardContent>

      {/* 게시물 추가 대화상자 */}
      <PostAddModal
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        newPost={newPost}
        setNewPost={setNewPost}
        addPost={addPost}
      />

      {/* 게시물 수정 대화상자 */}
      {selectedPost && (
        <PostEditModal
          showEditDialog={showEditDialog}
          setShowEditDialog={setShowEditDialog}
          selectedPost={selectedPost}
          setSelectedPost={setSelectedPost}
          updatePost={updatePost}
        />
      )}

      {/* 댓글 추가 대화상자 */}
      {newComment.postId && (
        <CommentAddModal
          showAddCommentDialog={showAddCommentDialog}
          setShowAddCommentDialog={setShowAddCommentDialog}
          newComment={newComment}
          setNewComment={setNewComment}
          addComment={handleAddComment}
        />
      )}

      {/* 댓글 수정 대화상자 */}
      {selectedComment && (
        <CommentEditModal
          showEditCommentDialog={showEditCommentDialog}
          setShowEditCommentDialog={setShowEditCommentDialog}
          selectedComment={selectedComment}
          setSelectedComment={setSelectedComment}
          updateComment={updateComment}
        />
      )}
      {/* 게시물 상세 보기 대화상자 */}
      {selectedPost && (
        <PostDetailModal
          showPostDetailDialog={showPostDetailDialog}
          setShowPostDetailDialog={setShowPostDetailDialog}
          selectedPost={selectedPost}
          searchQuery={searchQuery}
        >
          <CommentList
            postId={selectedPost.id}
            searchQuery={searchQuery}
            comments={comments}
            setNewComment={setNewComment}
            setSelectedComment={setSelectedComment}
            likeComment={likeComment}
            deleteComment={deleteComment}
            setShowAddCommentDialog={setShowAddCommentDialog}
            setShowEditCommentDialog={setShowEditCommentDialog}
          />
        </PostDetailModal>
      )}
      {/* 사용자 정보 모달 */}
      <UserInfoModal
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        selectedUser={selectedUser}
      />
    </Card>
  )
}

export default PostsManager
