export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  time: string;
  league: string;
  status: string; // 'Live', 'Not Started', 'Match Finished'
  date: string;
  commentator?: string;
  channels?: string[];
  qualities?: string[];
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string;
}

export interface Channel {
  name: string;
  tvgName: string;
  logo: string;
  group: string;
  url: string;
  streamId: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_winner: string; // 'home', 'away', 'draw'
  home_score: number;
  away_score: number;
  predicted_scorer: string;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  wallet_address: string;
  status: 'pending' | 'paid';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  points: number;
  balance: number;
  is_verified: boolean;
  created_at: string;
}

export interface LeaderboardUser {
  rank?: number;
  username: string;
  points: number;
  correct_count: number;
}
