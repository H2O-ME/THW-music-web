export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  pic: string;
  url: string;
  lrc: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Playlist {
  id: string;
  name: string;
  coverImgUrl: string;
  description: string;
  trackCount: number;
}

export interface Artist {
  id: number;
  name: string;
  picUrl: string;
  img1v1Url: string;
  albumSize: number;
  musicSize: number;
}

export interface HotSearchItem {
  searchWord: string;
  score: number;
  content: string;
  source: number;
  iconType: number;
  iconUrl: string | null;
  url: string;
  alg: string;
}

export interface NewSongItem {
  id: number;
  name: string;
  picUrl: string;
  song: {
    artists: Artist[];
    duration: number;
    album: {
      blurPicUrl: string;
    };
  };
}
