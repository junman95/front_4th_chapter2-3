import { User } from "../../user/model/types"

interface Post {
  id: number
  title: string
  body: string
  tags: string[]
  reactions: {
    likes: number
    dislikes: number
  }
  views: number
  userId: number
  author: User
}

interface NewPost {
  title: Post["title"]
  body: Post["body"]
  userId: User["id"]
}
interface Comment {
  id: number
  body: string
  likes: number
  postId: Post["id"]
  user: Pick<User, "id" | "username"> & { fullName: string }
}

interface NewComment {
  body: Comment["body"]
  postId: Comment["postId"] | null
  userId: Comment["user"]["id"]
}

export type { Post, NewPost, Comment, NewComment }
