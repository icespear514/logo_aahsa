export type Role = 'master' | 'voter'

export type Profile = {
  id: string
  email: string
  role: Role
  invited_by: string | null
  created_at: string
}

export type Submission = {
  id: string
  email: string
  filename: string
  storage_path: string
  public_url: string
  submitted_at: string
  is_winner: boolean
}

export type Vote = {
  id: string
  voter_id: string
  submission_id: string
  created_at: string
}

export type ContestSettings = {
  id: number
  voting_open: boolean
  winner_page_active: boolean
  updated_at: string
}

export type SubmissionWithVotes = Submission & { votes: number }

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'submitted_at' | 'is_winner'>
        Update: Partial<Omit<Submission, 'id'>>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'id' | 'created_at'>
        Update: never
      }
      contest_settings: {
        Row: ContestSettings
        Insert: Partial<ContestSettings>
        Update: Partial<Omit<ContestSettings, 'id'>>
      }
    }
  }
}
