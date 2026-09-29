export type NavTab = 'home' | 'challenges' | 'classroom' | 'contests' | 'communities' | 'codelab' | 'search' | 'profile' | 'admin' | 'auth';

export type UserRole = 'student' | 'university' | 'admin';

export type UserStatus = 'active' | 'pending_approval' | 'rejected' | 'suspended';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  contact_email?: string;
  handle: string;
  avatar?: string;
  bio?: string;
  college?: string;
  role?: UserRole;
  status?: UserStatus;
  rejection_reason?: string;
  created_at: string;
}

export interface FacultyApplication {
  id: string;
  user_id: string;
  name: string;
  email: string;
  contact_email?: string;
  institution: string;
  department: string;
  designation?: string;
  proof_link_1?: string;
  proof_link_2?: string;
  link_1_scraped_summary?: string;
  link_2_scraped_summary?: string;
  online_search_results_json?: string;
  linkedin_url?: string;
  resume_url?: string;
  id_card_url?: string;
  extra_links?: string;
  statement_of_purpose?: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_recommendation?: 'ACCEPT' | 'REJECT' | 'NEEDS_MANUAL_REVIEW';
  ai_verification_score?: number;
  ai_risk_score?: number;
  ai_confidence?: string;
  ai_reasoning?: string;
  ai_dossier?: any;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html: string;
  email_type: string;
  sent_at: string;
}

export type PostType = 'youtube_course' | 'tweet' | 'hackathon';

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_handle: string;
  user_avatar?: string;
  post_type: PostType;
  title?: string;
  content: string;
  why_recommend?: string;
  youtube_url?: string;
  course_url?: string;
  image_url?: string;
  tags?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  is_studymate?: boolean;
  is_liked?: boolean;
  is_self?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_name: string;
  user_avatar?: string;
  comment_text: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  section: string;
  question_num: number;
  question: string;
  question_text?: string;
  options: string[];
  correct_index?: number;
  correct_option_index?: number;
  correct_answer?: string;
  explanation?: string;
}

export interface QuizSection {
  name: string;
  total_questions: number;
  start_idx?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  exam_type: 'jee_main' | 'custom';
  duration_minutes: number;
  total_marks: number;
  positive_marks: number;
  negative_marks: number;
  sections: QuizSection[];
  questions?: QuizQuestion[];
  questions_count?: number;
  created_by: string;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  is_solved?: boolean;
  subjects?: string[];
}

export interface QuizEvaluationDetail {
  id: string;
  section: string;
  question_num: number;
  question: string;
  options: string[];
  user_choice: number | null;
  correct_index: number;
  correct_answer: string;
  status: 'correct' | 'incorrect' | 'unattempted';
  marks_awarded: number;
  explanation: string;
}

export interface QuizSubmissionResult {
  success: boolean;
  score: number;
  max_marks: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number;
  detailed_results: QuizEvaluationDetail[];
}

export interface SampleCase {
  input: string;
  output: string;
  explanation: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string;
  sample_cases: SampleCase[];
  starter_templates?: Record<string, string>;
  total_test_cases?: number;
  acceptance_rate?: number;
  created_by: string;
  created_at: string;
}

export interface TestCaseResult {
  case_number: number;
  passed: boolean;
  status: string;
  is_hidden: boolean;
  input: string;
  expected_output: string;
  actual_output: string;
  execution_time_ms: number;
}

export interface CodeEvalResult {
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  all_passed: boolean;
  passed_count: number;
  total_count: number;
  avg_time_ms: number;
  results: TestCaseResult[];
}

export interface Channel {
  id: string;
  community_id: string;
  name: string;
  channel_type: 'announcement' | 'general' | 'doubts';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: string;
  members_count: number;
  channels: Channel[];
  admin_id?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  community_id: string;
  channel_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  code_snippet?: string;
  shared_post_id?: string;
  shared_post?: Post;
  created_at: string;
}

// ─── UNIVERSITY CLASSROOM & EXTENSION TYPES ─────────────────────────
export interface ClassroomStudent {
  id: string;
  joined_at: string;
  user_id: string;
  name: string;
  handle: string;
  avatar?: string;
  college?: string;
}

export interface Classroom {
  id: string; // 32-character ID
  name: string;
  subject_code: string;
  department?: string;
  university: string;
  description?: string;
  faculty_id: string;
  faculty_name: string;
  faculty_avatar?: string;
  cover_gradient?: string;
  created_at: string;
  student_count?: number;
  pending_requests_count?: number;
  is_faculty?: boolean;
  member_status?: 'accepted' | 'pending' | 'rejected' | 'none';
  students?: ClassroomStudent[];
}

export interface ClassroomJoinRequest {
  member_id: string;
  classroom_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  joined_at: string;
  student_name: string;
  student_handle: string;
  student_avatar?: string;
  student_email?: string;
  student_college?: string;
  student_bio?: string;
}

export interface ClassroomPost {
  id: string;
  classroom_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  post_type: 'announcement' | 'lecture' | 'resource' | 'assignment' | 'youtube_course';
  title: string;
  content: string;
  attachment_url?: string;
  youtube_url?: string;
  image_url?: string;
  tags?: string;
  likes_count: number;
  comments_count?: number;
  reposts_count?: number;
  is_liked?: boolean;
  created_at: string;
}

export interface ClassroomComment {
  id: string;
  post_id: string;
  classroom_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  comment_text: string;
  created_at: string;
}

export interface ClassroomChannel {
  id: string;
  classroom_id: string;
  name: string;
  channel_type: 'announcement' | 'general' | 'doubts';
  created_by?: string;
  created_at: string;
}

export interface ClassroomMessage {
  id: string;
  classroom_id: string;
  channel_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'student' | 'faculty';
  text: string;
  code_snippet?: string;
  created_at: string;
}

export interface ClassroomQuiz {
  id: string;
  classroom_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  positive_marks: number;
  negative_marks: number;
  sections?: QuizSection[];
  questions?: QuizQuestion[];
  questions_count?: number;
  created_by: string;
  created_at: string;
  attempted?: boolean;
  user_score?: number | null;
}

export interface ClassroomProblem {
  id: string;
  classroom_id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string;
  sample_cases: SampleCase[];
  starter_templates?: Record<string, string>;
  created_by: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  sender_id?: string;
  sender_name?: string;
  type: 'join_request' | 'join_accepted' | 'join_rejected' | 'new_post' | 'new_contest' | 'new_challenge' | 'studymate_request' | 'studymate_accepted';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: number;
  created_at: string;
}

export interface StudyMate {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  college?: string;
  role?: string;
  connected_at?: string;
}

export interface StudyMateRequest {
  id: string;
  sender_id: string;
  receiver_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_name: string;
  sender_handle: string;
  sender_avatar?: string;
  sender_role?: string;
  sender_college?: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_avatar?: string;
  text: string;
  code_snippet?: string;
  shared_post_id?: string;
  shared_post?: Post;
  created_at: string;
}

export interface UserPublicProfile {
  user: User;
  studymate_status: 'self' | 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  stats: {
    quizzes_taken: number;
    problems_solved: number;
    posts_count: number;
    studymates_count: number;
  };
  recent_posts: Post[];
}

